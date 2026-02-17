import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { withMiddleware, AuthContext, checkIdempotency } from "../_shared/middleware.ts";
import { jsonResponse, ValidationError } from "../_shared/errors.ts";
import { logAudit, getClientIp } from "../_shared/audit.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { exchangeToken } from "../_shared/ifood-client.ts";

/**
 * POST /ifood-connect
 *
 * Connects a new iFood merchant account. Validates credentials by attempting
 * an OAuth token exchange, then stores the account and grants access.
 *
 * Body: { merchant_id: string, client_id: string, client_secret: string, name: string }
 * Requires: user_can(userId, 'restaurants', 'create')
 */
const handler = withMiddleware(
  async (req: Request, ctx: AuthContext | null): Promise<Response> => {
    const { userId, adminClient } = ctx!;

    // Idempotency check
    await checkIdempotency(adminClient, req);

    // Rate limit: max 5 connect attempts per minute
    await checkRateLimit(adminClient, userId, getClientIp(req), {
      functionName: "ifood-connect",
      maxRequests: 5,
      windowSeconds: 60,
    });

    // Parse and validate input
    const body = await req.json();
    const { merchant_id, client_id, client_secret, name } = body;

    if (!merchant_id || typeof merchant_id !== "string") {
      throw new ValidationError("merchant_id is required");
    }

    if (!client_id || typeof client_id !== "string") {
      throw new ValidationError("client_id is required");
    }

    if (!client_secret || typeof client_secret !== "string") {
      throw new ValidationError("client_secret is required");
    }

    if (!name || typeof name !== "string") {
      throw new ValidationError("name is required");
    }

    // Check if account already exists for this merchant
    const { data: existingAccount } = await adminClient
      .from("ifood_accounts")
      .select("id")
      .eq("merchant_id", merchant_id)
      .maybeSingle();

    if (existingAccount) {
      throw new ValidationError("An iFood account already exists for this merchant_id");
    }

    // Attempt OAuth token exchange to validate credentials
    const tokenData = await exchangeToken(client_id, client_secret);

    // Calculate token expiry
    const tokenExpiresAt = new Date(
      Date.now() + tokenData.expiresIn * 1000,
    ).toISOString();

    // Create the iFood account record
    const { data: account, error: insertError } = await adminClient
      .from("ifood_accounts")
      .insert({
        name,
        merchant_id,
        is_active: true,
        access_token: tokenData.accessToken,
        refresh_token: tokenData.refreshToken,
        token_expires_at: tokenExpiresAt,
        created_by: userId,
      })
      .select("id, name, merchant_id, is_active, token_expires_at, created_at")
      .single();

    if (insertError) {
      console.error("Failed to create iFood account:", insertError.message);
      throw new Error("Failed to create iFood account");
    }

    // Grant access to the connecting user
    const { error: accessError } = await adminClient
      .from("ifood_account_access")
      .insert({
        ifood_account_id: account.id,
        user_id: userId,
        granted_by: userId,
      });

    if (accessError) {
      console.error("Failed to grant account access:", accessError.message);
    }

    // Audit log
    await logAudit(adminClient, {
      userId,
      action: "connect_ifood_account",
      entity: "ifood_accounts",
      entityId: account.id,
      newData: { name, merchant_id },
      ipAddress: getClientIp(req),
    });

    return jsonResponse({
      success: true,
      account: {
        id: account.id,
        name: account.name,
        merchant_id: account.merchant_id,
        is_active: account.is_active,
        token_expires_at: account.token_expires_at,
        created_at: account.created_at,
      },
    }, 201);
  },
  { permission: ["restaurants", "create"] },
);

serve(handler);
