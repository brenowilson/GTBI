import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import {
  withMiddleware,
  AuthContext,
  checkIdempotency,
} from "../_shared/middleware.ts";
import { jsonResponse, ValidationError } from "../_shared/errors.ts";
import { logAudit, getClientIp } from "../_shared/audit.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { sendEmail, buildEmailHtml } from "../_shared/resend.ts";
import { sendWhatsAppMessage } from "../_shared/uazapi.ts";

interface Recipient {
  user_id: string;
  phone?: string;
}

/**
 * POST /admin-send-notification
 *
 * Sends notifications to users via email and/or WhatsApp.
 * Creates admin_notification records for each recipient and channel.
 *
 * Body: {
 *   title: string,
 *   body: string,
 *   channel: "email" | "whatsapp" | "both",
 *   recipient_user_ids: string[],
 *   recipient_phones?: Record<string, string> (user_id -> phone, for WhatsApp)
 * }
 * Requires: user_can(userId, 'users', 'create')
 */
const handler = withMiddleware(
  async (req: Request, ctx: AuthContext | null): Promise<Response> => {
    const { userId, adminClient } = ctx!;

    // Idempotency check
    await checkIdempotency(adminClient, req);

    // Rate limit: max 20 notifications per minute
    await checkRateLimit(adminClient, userId, getClientIp(req), {
      functionName: "admin-send-notification",
      maxRequests: 20,
      windowSeconds: 60,
    });

    // Parse and validate input
    const body = await req.json();
    const {
      title,
      body: notificationBody,
      channel,
      recipient_user_ids,
      recipient_phones,
    } = body;

    if (!title || typeof title !== "string") {
      throw new ValidationError("title is required");
    }

    if (!notificationBody || typeof notificationBody !== "string") {
      throw new ValidationError("body is required");
    }

    const validChannels = ["email", "whatsapp", "both"];
    if (!channel || !validChannels.includes(channel)) {
      throw new ValidationError("channel must be 'email', 'whatsapp', or 'both'");
    }

    if (
      !recipient_user_ids ||
      !Array.isArray(recipient_user_ids) ||
      recipient_user_ids.length === 0
    ) {
      throw new ValidationError("recipient_user_ids is required (non-empty array of user IDs)");
    }

    // Phone number map (user_id -> phone) for WhatsApp delivery
    const phoneMap: Record<string, string> =
      recipient_phones && typeof recipient_phones === "object" ? recipient_phones : {};

    // Fetch recipient profiles
    const { data: profiles, error: profileError } = await adminClient
      .from("user_profiles")
      .select("id, email, full_name")
      .in("id", recipient_user_ids);

    if (profileError) {
      throw new Error(`Failed to fetch recipient profiles: ${profileError.message}`);
    }

    if (!profiles || profiles.length === 0) {
      throw new ValidationError("No valid recipients found for the given user IDs");
    }

    const channels: string[] = channel === "both" ? ["email", "whatsapp"] : [channel];
    const results: Array<{
      user_id: string;
      channel: string;
      status: string;
      error?: string;
    }> = [];

    for (const profile of profiles) {
      for (const ch of channels) {
        let status = "pending";
        let errorMessage: string | null = null;

        try {
          if (ch === "email") {
            await sendEmail({
              to: profile.email,
              subject: `GTBI - ${title}`,
              html: buildEmailHtml(
                title,
                `
                <h2>${title}</h2>
                <p>${notificationBody.replace(/\n/g, "<br>")}</p>
                `,
              ),
            });
            status = "sent";
          } else if (ch === "whatsapp") {
            const phone = phoneMap[profile.id];

            if (!phone) {
              status = "failed";
              errorMessage =
                "Phone number not provided. Include recipient_phones map with user_id -> phone.";
            } else {
              await sendWhatsAppMessage({
                phone,
                message: `*GTBI - ${title}*\n\n${notificationBody}`,
              });
              status = "sent";
            }
          }
        } catch (error) {
          status = "failed";
          errorMessage = error instanceof Error ? error.message : "Unknown error";
          console.error(
            `Failed to send ${ch} notification to ${profile.id}:`,
            errorMessage,
          );
        }

        // Create admin_notification record
        await adminClient.from("admin_notifications").insert({
          title,
          body: notificationBody,
          channel: ch,
          recipient_user_id: profile.id,
          sent_by: userId,
          status,
          error_message: errorMessage,
          sent_at: status === "sent" ? new Date().toISOString() : null,
        });

        results.push({
          user_id: profile.id,
          channel: ch,
          status,
          error: errorMessage ?? undefined,
        });
      }
    }

    const sentCount = results.filter((r) => r.status === "sent").length;
    const failedCount = results.filter((r) => r.status === "failed").length;

    // Audit log
    await logAudit(adminClient, {
      userId,
      action: "send_admin_notification",
      entity: "admin_notifications",
      newData: {
        title,
        channel,
        recipient_count: profiles.length,
        sent_count: sentCount,
        failed_count: failedCount,
      },
      ipAddress: getClientIp(req),
    });

    return jsonResponse({
      success: failedCount === 0,
      sent_count: sentCount,
      failed_count: failedCount,
      total_recipients: profiles.length,
      results,
    }, 201);
  },
  { permission: ["users", "create"] },
);

serve(handler);
