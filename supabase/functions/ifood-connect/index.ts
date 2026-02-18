import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { withMiddleware, AuthContext, checkIdempotency } from "../_shared/middleware.ts";
import { jsonResponse, ValidationError } from "../_shared/errors.ts";
import { logAudit, getClientIp } from "../_shared/audit.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { requestUserCode, exchangeToken } from "../_shared/ifood-client.ts";

/**
 * POST /ifood-connect
 *
 * Two-step iFood device authorization flow:
 *
 * Step 1 — request_code:
 *   Body: { action: "request_code" }
 *   Returns: { userCode, verificationUrl, authorizationCodeVerifier, expiresIn }
 *
 * Step 2 — authorize:
 *   Body: { action: "authorize", merchant_id, name, authorization_code_verifier }
 *   Exchanges the verifier for tokens, creates the ifood_account record.
 *
 * Requires: user_can(userId, 'restaurants', 'create')
 */
const handler = withMiddleware(
  async (req: Request, ctx: AuthContext | null): Promise<Response> => {
    const { userId, adminClient } = ctx!;

    const body = await req.json();
    const { action } = body;

    if (!action || typeof action !== "string") {
      throw new ValidationError("action is required ('request_code' or 'authorize')");
    }

    const clientId = Deno.env.get("IFOOD_CLIENT_ID");
    const clientSecret = Deno.env.get("IFOOD_CLIENT_SECRET");

    if (!clientId || !clientSecret) {
      throw new Error(
        "IFOOD_CLIENT_ID and IFOOD_CLIENT_SECRET must be configured as Edge Function secrets",
      );
    }

    // Rate limit
    await checkRateLimit(adminClient, userId, getClientIp(req), {
      functionName: "ifood-connect",
      maxRequests: 10,
      windowSeconds: 60,
    });

    // ---------------------------------------------------------------
    // Step 1: Request a user code from iFood
    // ---------------------------------------------------------------
    if (action === "request_code") {
      const codeResponse = await requestUserCode(clientId);

      return jsonResponse({
        success: true,
        userCode: codeResponse.userCode,
        verificationUrl: codeResponse.verificationUrl,
        verificationUrlComplete: codeResponse.verificationUrlComplete,
        authorizationCodeVerifier: codeResponse.authorizationCodeVerifier,
        expiresIn: codeResponse.expiresIn,
      });
    }

    // ---------------------------------------------------------------
    // Step 2: Exchange verifier for tokens and create account
    // ---------------------------------------------------------------
    if (action === "authorize") {
      const { merchant_id, name, authorization_code_verifier } = body;

      if (!merchant_id || typeof merchant_id !== "string") {
        throw new ValidationError("merchant_id is required");
      }

      if (!name || typeof name !== "string") {
        throw new ValidationError("name is required");
      }

      if (!authorization_code_verifier || typeof authorization_code_verifier !== "string") {
        throw new ValidationError("authorization_code_verifier is required");
      }

      // Idempotency check
      await checkIdempotency(adminClient, req);

      // Check if account already exists for this merchant
      const { data: existingAccount } = await adminClient
        .from("ifood_accounts")
        .select("id")
        .eq("merchant_id", merchant_id)
        .maybeSingle();

      if (existingAccount) {
        throw new ValidationError("An iFood account already exists for this merchant_id");
      }

      // Exchange verifier for tokens.
      // In iFood's flow, the authorizationCodeVerifier from requestUserCode
      // is used as both authorizationCode and authorizationCodeVerifier.
      const tokenData = await exchangeToken(
        clientId,
        clientSecret,
        authorization_code_verifier,
        authorization_code_verifier,
      );

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
        throw new Error(`Failed to create iFood account: ${insertError.message}`);
      }

      // Grant access to the connecting user
      await adminClient
        .from("ifood_account_access")
        .insert({
          ifood_account_id: account.id,
          user_id: userId,
          granted_by: userId,
        });

      // Audit log
      await logAudit(adminClient, {
        userId,
        action: "connect_ifood_account",
        entity: "ifood_accounts",
        entityId: account.id,
        newData: { name, merchant_id },
        ipAddress: getClientIp(req),
      });

      return jsonResponse({ success: true, account }, 201);
    }

    throw new ValidationError(
      `Unknown action: ${action}. Use 'request_code' or 'authorize'.`,
    );
  },
  { permission: ["restaurants", "create"] },
);

serve(handler);
