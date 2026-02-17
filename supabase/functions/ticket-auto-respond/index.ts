import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import {
  withMiddleware,
  AuthContext,
  requireRestaurantAccess,
} from "../_shared/middleware.ts";
import { jsonResponse, ValidationError, NotFoundError } from "../_shared/errors.ts";
import { logAudit, getClientIp } from "../_shared/audit.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { chatCompletion } from "../_shared/openai.ts";
import { respondToTicket } from "../_shared/ifood-client.ts";

/**
 * POST /ticket-auto-respond
 *
 * Automatically responds to a support ticket based on restaurant settings.
 * Supports two modes: 'template' (placeholder substitution) and 'ai' (OpenAI).
 *
 * Body: { ticket_id: string }
 * Requires: authenticated + access to the ticket's restaurant
 */
const handler = withMiddleware(
  async (req: Request, ctx: AuthContext | null): Promise<Response> => {
    const { userId, adminClient } = ctx!;

    // Parse and validate input
    const body = await req.json();
    const { ticket_id } = body;

    if (!ticket_id || typeof ticket_id !== "string") {
      throw new ValidationError("ticket_id is required");
    }

    // Fetch the ticket
    const { data: ticket, error: ticketError } = await adminClient
      .from("tickets")
      .select("id, restaurant_id, ifood_ticket_id, subject, status, order_id")
      .eq("id", ticket_id)
      .maybeSingle();

    if (ticketError || !ticket) {
      throw new NotFoundError("Ticket", ticket_id);
    }

    // Check ticket is still open
    if (ticket.status === "closed" || ticket.status === "resolved") {
      throw new ValidationError(`Ticket is already ${ticket.status}`);
    }

    // Check restaurant access
    await requireRestaurantAccess(adminClient, userId, ticket.restaurant_id);

    // Rate limit
    await checkRateLimit(adminClient, userId, getClientIp(req), {
      functionName: "ticket-auto-respond",
      maxRequests: 30,
      windowSeconds: 60,
    });

    // Fetch restaurant settings
    const { data: restaurant, error: restError } = await adminClient
      .from("restaurants")
      .select(
        "id, name, ifood_restaurant_id, ifood_account_id, ticket_auto_reply_enabled, ticket_auto_reply_mode, ticket_reply_template, ticket_ai_prompt",
      )
      .eq("id", ticket.restaurant_id)
      .maybeSingle();

    if (restError || !restaurant) {
      throw new NotFoundError("Restaurant", ticket.restaurant_id);
    }

    if (!restaurant.ticket_auto_reply_enabled) {
      throw new ValidationError(
        "Auto-reply for tickets is not enabled for this restaurant. Enable it in settings.",
      );
    }

    // Get iFood access token
    const { data: account } = await adminClient
      .from("ifood_accounts")
      .select("access_token")
      .eq("id", restaurant.ifood_account_id)
      .maybeSingle();

    if (!account?.access_token) {
      throw new ValidationError("iFood account has no valid access token");
    }

    // Fetch existing messages for context
    const { data: existingMessages } = await adminClient
      .from("ticket_messages")
      .select("sender, content, created_at")
      .eq("ticket_id", ticket_id)
      .order("created_at", { ascending: true })
      .limit(10);

    let responseText: string;
    let responseMode: string;

    if (restaurant.ticket_auto_reply_mode === "ai") {
      // AI mode
      responseMode = "ai";

      const conversationContext = existingMessages
        ?.map((m) => `[${m.sender}]: ${m.content}`)
        .join("\n") ?? "";

      const systemPrompt = restaurant.ticket_ai_prompt ??
        `You are a restaurant customer support agent responding to a ticket on iFood.
Be professional, helpful, and solution-oriented. Respond in Portuguese (Brazil).
Address the customer's concern directly. Keep responses concise (under 300 characters).`;

      const userPrompt = `Ticket subject: ${ticket.subject ?? "N/A"}
Order ID: ${ticket.order_id ?? "N/A"}

Conversation so far:
${conversationContext || "(No messages yet)"}

Write a helpful response:`;

      responseText = await chatCompletion({
        systemPrompt,
        userPrompt,
        temperature: 0.7,
        maxTokens: 256,
      });

      responseText = responseText.trim().substring(0, 500);
    } else {
      // Template mode
      responseMode = "template";
      const template = restaurant.ticket_reply_template ??
        "Olá! Recebemos seu chamado sobre \"{{subject}}\". Estamos verificando e retornaremos em breve. Obrigado pela paciência!";

      responseText = template
        .replace(/\{\{subject\}\}/g, ticket.subject ?? "")
        .replace(/\{\{order_id\}\}/g, ticket.order_id ?? "")
        .replace(/\{\{restaurant_name\}\}/g, restaurant.name ?? "");
    }

    // Submit to iFood API
    let responseStatus = "pending";
    let responseError: string | null = null;

    try {
      if (ticket.ifood_ticket_id) {
        await respondToTicket(
          account.access_token,
          restaurant.ifood_restaurant_id,
          ticket.ifood_ticket_id,
          responseText,
        );
        responseStatus = "sent";
      } else {
        responseStatus = "sent";
      }
    } catch (error) {
      responseStatus = "failed";
      responseError = error instanceof Error ? error.message : "Unknown error";
      console.error("Failed to submit ticket response to iFood:", responseError);
    }

    // Create ticket_message record
    const { data: message, error: msgError } = await adminClient
      .from("ticket_messages")
      .insert({
        ticket_id,
        sender: "restaurant",
        content: responseText,
        response_mode: responseMode,
        response_status: responseStatus,
        response_error: responseError,
        sent_at: responseStatus === "sent" ? new Date().toISOString() : null,
      })
      .select("id")
      .single();

    if (msgError) {
      console.error("Failed to create ticket message:", msgError.message);
    }

    // Update ticket status to in_progress if it was open
    if (ticket.status === "open") {
      await adminClient
        .from("tickets")
        .update({ status: "in_progress" })
        .eq("id", ticket_id);
    }

    // Audit log
    await logAudit(adminClient, {
      userId,
      action: "auto_respond_ticket",
      entity: "tickets",
      entityId: ticket_id,
      newData: {
        message_id: message?.id,
        response_mode: responseMode,
        response_status: responseStatus,
      },
      ipAddress: getClientIp(req),
    });

    return jsonResponse({
      success: responseStatus === "sent",
      ticket_id,
      message_id: message?.id,
      response: responseText,
      response_mode: responseMode,
      response_status: responseStatus,
      response_error: responseError,
    });
  },
);

serve(handler);
