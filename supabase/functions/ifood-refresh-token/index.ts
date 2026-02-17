import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import {
  withMiddleware,
  AuthContext,
  requireIfoodAccountAccess,
} from "../_shared/middleware.ts";
import { jsonResponse, ValidationError, NotFoundError } from "../_shared/errors.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { getClientIp } from "../_shared/audit.ts";
import { refreshToken } from "../_shared/ifood-client.ts";

/**
 * POST /ifood-refresh-token
 *
 * Refreshes the OAuth token for a specific iFood account.
 *
 * Body: { ifood_account_id: string }
 * Requires: authenticated + access to the iFood account
 */
const handler = withMiddleware(
  async (req: Request, ctx: AuthContext | null): Promise<Response> => {
    const { userId, adminClient } = ctx!;

    // Parse and validate input
    const body = await req.json();
    const { ifood_account_id } = body;

    if (!ifood_account_id || typeof ifood_account_id !== "string") {
      throw new ValidationError("ifood_account_id is required");
    }

    // Check access to this account
    await requireIfoodAccountAccess(adminClient, userId, ifood_account_id);

    // Rate limit: max 10 refresh attempts per minute
    await checkRateLimit(adminClient, userId, getClientIp(req), {
      functionName: "ifood-refresh-token",
      maxRequests: 10,
      windowSeconds: 60,
    });

    // Fetch the current account credentials
    const { data: account, error: fetchError } = await adminClient
      .from("ifood_accounts")
      .select("id, merchant_id, access_token, refresh_token, token_expires_at")
      .eq("id", ifood_account_id)
      .maybeSingle();

    if (fetchError || !account) {
      throw new NotFoundError("iFood account", ifood_account_id);
    }

    if (!account.refresh_token) {
      throw new ValidationError(
        "No refresh token available. Please reconnect the iFood account.",
      );
    }

    // We need the client_id and client_secret from environment or config.
    // The iFood API uses application-level credentials (IFOOD_CLIENT_ID/SECRET)
    // combined with the per-account refresh_token.
    const clientId = Deno.env.get("IFOOD_CLIENT_ID");
    const clientSecret = Deno.env.get("IFOOD_CLIENT_SECRET");

    if (!clientId || !clientSecret) {
      throw new Error("IFOOD_CLIENT_ID or IFOOD_CLIENT_SECRET not configured");
    }

    // Refresh the token
    const tokenData = await refreshToken(clientId, clientSecret, account.refresh_token);

    const tokenExpiresAt = new Date(
      Date.now() + tokenData.expiresIn * 1000,
    ).toISOString();

    // Update the account with new tokens
    const { error: updateError } = await adminClient
      .from("ifood_accounts")
      .update({
        access_token: tokenData.accessToken,
        refresh_token: tokenData.refreshToken,
        token_expires_at: tokenExpiresAt,
      })
      .eq("id", ifood_account_id);

    if (updateError) {
      console.error("Failed to update tokens:", updateError.message);
      throw new Error("Failed to save refreshed tokens");
    }

    return jsonResponse({
      success: true,
      token_expires_at: tokenExpiresAt,
    });
  },
);

serve(handler);
