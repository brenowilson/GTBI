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
import { respondToReview } from "../_shared/ifood-client.ts";

/**
 * POST /review-auto-respond
 *
 * Automatically responds to a review based on restaurant settings.
 * Supports two modes: 'template' (placeholder substitution) and 'ai' (OpenAI).
 *
 * Body: { review_id: string }
 * Requires: authenticated + access to the review's restaurant
 */
const handler = withMiddleware(
  async (req: Request, ctx: AuthContext | null): Promise<Response> => {
    const { userId, adminClient } = ctx!;

    // Parse and validate input
    const body = await req.json();
    const { review_id } = body;

    if (!review_id || typeof review_id !== "string") {
      throw new ValidationError("review_id is required");
    }

    // Fetch the review
    const { data: review, error: reviewError } = await adminClient
      .from("reviews")
      .select(
        "id, restaurant_id, ifood_review_id, rating, comment, customer_name, response, response_status",
      )
      .eq("id", review_id)
      .maybeSingle();

    if (reviewError || !review) {
      throw new NotFoundError("Review", review_id);
    }

    // Check if already responded
    if (review.response_status === "sent") {
      throw new ValidationError("This review has already been responded to");
    }

    // Check restaurant access
    await requireRestaurantAccess(adminClient, userId, review.restaurant_id);

    // Rate limit
    await checkRateLimit(adminClient, userId, getClientIp(req), {
      functionName: "review-auto-respond",
      maxRequests: 30,
      windowSeconds: 60,
    });

    // Fetch restaurant settings
    const { data: restaurant, error: restError } = await adminClient
      .from("restaurants")
      .select(
        "id, name, ifood_restaurant_id, ifood_account_id, review_auto_reply_enabled, review_auto_reply_mode, review_reply_template, review_ai_prompt",
      )
      .eq("id", review.restaurant_id)
      .maybeSingle();

    if (restError || !restaurant) {
      throw new NotFoundError("Restaurant", review.restaurant_id);
    }

    if (!restaurant.review_auto_reply_enabled) {
      throw new ValidationError(
        "Auto-reply is not enabled for this restaurant. Enable it in settings.",
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

    let responseText: string;
    let responseMode: string;

    if (restaurant.review_auto_reply_mode === "ai") {
      // AI mode: generate response with OpenAI
      responseMode = "ai";
      const systemPrompt = restaurant.review_ai_prompt ??
        `You are a restaurant manager responding to a customer review on iFood.
Be professional, empathetic, and concise. Respond in Portuguese (Brazil).
If the review is positive, thank the customer. If negative, acknowledge the issue and offer to improve.
Keep responses under 200 characters.`;

      const userPrompt = `Customer: ${review.customer_name ?? "Cliente"}
Rating: ${review.rating}/5
Comment: ${review.comment ?? "(no comment)"}

Write a professional response:`;

      responseText = await chatCompletion({
        systemPrompt,
        userPrompt,
        temperature: 0.7,
        maxTokens: 256,
      });

      // Trim to reasonable length
      responseText = responseText.trim().substring(0, 500);
    } else {
      // Template mode: placeholder substitution
      responseMode = "template";
      const template = restaurant.review_reply_template ??
        "Olá {{customer_name}}, obrigado pela sua avaliação! Sua opinião é muito importante para nós.";

      responseText = template
        .replace(/\{\{customer_name\}\}/g, review.customer_name ?? "Cliente")
        .replace(/\{\{rating\}\}/g, String(review.rating ?? ""))
        .replace(/\{\{restaurant_name\}\}/g, restaurant.name ?? "");
    }

    // Submit response to iFood API
    let responseStatus = "pending";
    let responseError: string | null = null;

    try {
      if (review.ifood_review_id) {
        await respondToReview(
          account.access_token,
          restaurant.ifood_restaurant_id,
          review.ifood_review_id,
          responseText,
        );
        responseStatus = "sent";
      } else {
        // No iFood review ID — save locally only
        responseStatus = "sent";
      }
    } catch (error) {
      responseStatus = "failed";
      responseError = error instanceof Error ? error.message : "Unknown error";
      console.error("Failed to submit review response to iFood:", responseError);
    }

    // Update review record
    await adminClient
      .from("reviews")
      .update({
        response: responseText,
        response_sent_at: responseStatus === "sent" ? new Date().toISOString() : null,
        response_mode: responseMode,
        response_status: responseStatus,
        response_error: responseError,
      })
      .eq("id", review_id);

    // Audit log
    await logAudit(adminClient, {
      userId,
      action: "auto_respond_review",
      entity: "reviews",
      entityId: review_id,
      newData: {
        response_mode: responseMode,
        response_status: responseStatus,
        response_length: responseText.length,
      },
      ipAddress: getClientIp(req),
    });

    return jsonResponse({
      success: responseStatus === "sent",
      review_id,
      response: responseText,
      response_mode: responseMode,
      response_status: responseStatus,
      response_error: responseError,
    });
  },
);

serve(handler);
