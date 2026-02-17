import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import {
  withMiddleware,
  AuthContext,
  requirePermission,
  requireRestaurantAccess,
  checkIdempotency,
} from "../_shared/middleware.ts";
import { jsonResponse, ValidationError, NotFoundError } from "../_shared/errors.ts";
import { logAudit, getClientIp } from "../_shared/audit.ts";
import { sendEmail, buildEmailHtml } from "../_shared/resend.ts";
import { sendWhatsAppMessage, sendWhatsAppFile } from "../_shared/uazapi.ts";

/**
 * POST /report-send
 *
 * Sends a generated report via email and/or WhatsApp.
 * Requires explicit confirmation (confirm: true) in the request body.
 *
 * Body: {
 *   report_id: string,
 *   channels: ("email" | "whatsapp")[],
 *   recipients: { email?: string, phone?: string }[],
 *   confirm: boolean
 * }
 * Requires: user_can(userId, 'reports', 'update') + restaurant access
 */
const handler = withMiddleware(
  async (req: Request, ctx: AuthContext | null): Promise<Response> => {
    const { userId, adminClient } = ctx!;

    // Permission check
    await requirePermission(adminClient, userId, "reports", "update");

    // Idempotency check
    await checkIdempotency(adminClient, req);

    // Parse and validate input
    const body = await req.json();
    const { report_id, channels, recipients, confirm } = body;

    if (!report_id || typeof report_id !== "string") {
      throw new ValidationError("report_id is required");
    }

    if (!confirm || confirm !== true) {
      throw new ValidationError(
        "Sending a report requires explicit confirmation. Set confirm: true in the request body.",
      );
    }

    if (!channels || !Array.isArray(channels) || channels.length === 0) {
      throw new ValidationError("channels is required (array of 'email' and/or 'whatsapp')");
    }

    const validChannels = ["email", "whatsapp"];
    for (const ch of channels) {
      if (!validChannels.includes(ch)) {
        throw new ValidationError(`Invalid channel: ${ch}. Must be 'email' or 'whatsapp'.`);
      }
    }

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      throw new ValidationError("recipients is required (array of { email?, phone? })");
    }

    // Fetch the report
    const { data: report, error: reportError } = await adminClient
      .from("reports")
      .select("id, restaurant_id, week_start, week_end, status, pdf_url")
      .eq("id", report_id)
      .maybeSingle();

    if (reportError || !report) {
      throw new NotFoundError("Report", report_id);
    }

    // Check restaurant access
    await requireRestaurantAccess(adminClient, userId, report.restaurant_id);

    // Validate report is in sendable state
    if (report.status !== "generated" && report.status !== "sent" && report.status !== "failed") {
      throw new ValidationError(
        `Report is in '${report.status}' state. Only 'generated', 'sent', or 'failed' reports can be sent.`,
      );
    }

    // Get restaurant name
    const { data: restaurant } = await adminClient
      .from("restaurants")
      .select("name")
      .eq("id", report.restaurant_id)
      .maybeSingle();

    const restaurantName = restaurant?.name ?? "Restaurante";

    // Update status to 'sending'
    await adminClient
      .from("reports")
      .update({ status: "sending" })
      .eq("id", report_id);

    const sendResults: Array<{
      channel: string;
      recipient: string;
      status: string;
      error?: string;
    }> = [];

    let allSucceeded = true;

    // Send via each channel to each recipient
    for (const recipient of recipients) {
      // Email
      if (channels.includes("email") && recipient.email) {
        try {
          await sendEmail({
            to: recipient.email,
            subject: `GTBI - Relatorio Semanal: ${restaurantName} (${report.week_start} a ${report.week_end})`,
            html: buildEmailHtml(
              "Relatorio Semanal",
              `
              <h2>Relatorio Semanal - ${restaurantName}</h2>
              <p>Periodo: ${report.week_start} a ${report.week_end}</p>
              <p>Seu relatorio semanal esta pronto!</p>
              ${
                report.pdf_url
                  ? `<p style="text-align: center;"><a href="${report.pdf_url}" class="button">Visualizar Relatorio</a></p>`
                  : "<p>O relatorio sera disponibilizado em breve.</p>"
              }
              <p style="font-size: 13px; color: #666;">Este email foi enviado automaticamente pela plataforma GTBI.</p>
              `,
            ),
          });

          // Log success
          await adminClient.from("report_send_logs").insert({
            report_id,
            sent_by: userId,
            channel: "email",
            status: "sent",
            sent_at: new Date().toISOString(),
          });

          sendResults.push({
            channel: "email",
            recipient: recipient.email,
            status: "sent",
          });
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : "Unknown error";
          allSucceeded = false;

          await adminClient.from("report_send_logs").insert({
            report_id,
            sent_by: userId,
            channel: "email",
            status: "failed",
            error_message: errorMsg,
          });

          sendResults.push({
            channel: "email",
            recipient: recipient.email,
            status: "failed",
            error: errorMsg,
          });
        }
      }

      // WhatsApp
      if (channels.includes("whatsapp") && recipient.phone) {
        try {
          // Send text summary first
          await sendWhatsAppMessage({
            phone: recipient.phone,
            message: `*GTBI - Relatorio Semanal*\n\n${restaurantName}\nPeriodo: ${report.week_start} a ${report.week_end}\n\nSeu relatorio semanal esta pronto!`,
          });

          // Send file if available
          if (report.pdf_url) {
            await sendWhatsAppFile({
              phone: recipient.phone,
              fileUrl: report.pdf_url,
              caption: `Relatorio ${restaurantName} - ${report.week_start}`,
              fileName: `relatorio-${report.week_start}.html`,
            });
          }

          await adminClient.from("report_send_logs").insert({
            report_id,
            sent_by: userId,
            channel: "whatsapp",
            status: "sent",
            sent_at: new Date().toISOString(),
          });

          sendResults.push({
            channel: "whatsapp",
            recipient: recipient.phone,
            status: "sent",
          });
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : "Unknown error";
          allSucceeded = false;

          await adminClient.from("report_send_logs").insert({
            report_id,
            sent_by: userId,
            channel: "whatsapp",
            status: "failed",
            error_message: errorMsg,
          });

          sendResults.push({
            channel: "whatsapp",
            recipient: recipient.phone,
            status: "failed",
            error: errorMsg,
          });
        }
      }
    }

    // Update report status
    const finalStatus = allSucceeded ? "sent" : "failed";
    await adminClient
      .from("reports")
      .update({ status: finalStatus })
      .eq("id", report_id);

    // Audit log
    await logAudit(adminClient, {
      userId,
      action: "send_report",
      entity: "reports",
      entityId: report_id,
      newData: {
        channels,
        recipients_count: recipients.length,
        status: finalStatus,
        results: sendResults,
      },
      ipAddress: getClientIp(req),
    });

    return jsonResponse({
      success: allSucceeded,
      report_id,
      status: finalStatus,
      results: sendResults,
    });
  },
);

serve(handler);
