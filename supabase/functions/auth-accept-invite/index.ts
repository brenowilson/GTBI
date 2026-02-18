import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { withMiddleware, checkIdempotency } from "../_shared/middleware.ts";
import { getAdminClient } from "../_shared/supabase.ts";
import { jsonResponse, ValidationError, NotFoundError } from "../_shared/errors.ts";
import { logAudit, getClientIp } from "../_shared/audit.ts";

/**
 * POST /auth-accept-invite
 *
 * Accepts a pending invitation by token. Creates the auth user,
 * assigns the role, and marks the invitation as accepted.
 * This is a PUBLIC endpoint (no auth required).
 *
 * Body: { token: string, password: string, full_name: string }
 */
const handler = withMiddleware(
  async (req: Request): Promise<Response> => {
    const adminClient = getAdminClient();

    // Idempotency check
    await checkIdempotency(adminClient, req);

    // Parse and validate input
    const body = await req.json();
    const { token, password, full_name } = body;

    if (!token || typeof token !== "string") {
      throw new ValidationError("token is required");
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      throw new ValidationError("password must be at least 8 characters");
    }

    if (!full_name || typeof full_name !== "string" || full_name.trim().length < 2) {
      throw new ValidationError("full_name is required (minimum 2 characters)");
    }

    // Find the invitation
    const { data: invitation, error: invError } = await adminClient
      .from("invitations")
      .select("id, email, role_id, accepted_at, expires_at")
      .eq("token", token)
      .maybeSingle();

    if (invError || !invitation) {
      throw new NotFoundError("Invitation", token);
    }

    // Validate invitation state
    if (invitation.accepted_at) {
      throw new ValidationError("This invitation has already been accepted");
    }

    if (new Date(invitation.expires_at) < new Date()) {
      throw new ValidationError("This invitation has expired");
    }

    // Create the auth user via admin API
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: invitation.email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: full_name.trim(),
      },
    });

    if (authError) {
      console.error("Failed to create auth user:", authError.message);

      if (authError.message.includes("already registered")) {
        throw new ValidationError("A user with this email already exists");
      }

      throw new Error(`Failed to create user: ${authError.message}`);
    }

    const newUserId = authData.user.id;

    // Assign the role
    const { error: roleError } = await adminClient.from("user_roles").insert({
      user_id: newUserId,
      role_id: invitation.role_id,
      assigned_by: null, // System-assigned via invitation
    });

    if (roleError) {
      console.error("Failed to assign role:", roleError.message);
      // Delete the created user since the operation is incomplete
      await adminClient.auth.admin.deleteUser(newUserId);
      throw new Error(`Failed to assign role: ${roleError.message}`);
    }

    // Mark invitation as accepted
    const { error: updateError } = await adminClient
      .from("invitations")
      .update({ accepted_at: new Date().toISOString() })
      .eq("id", invitation.id);

    if (updateError) {
      console.error("Failed to update invitation:", updateError.message);
    }

    // Audit log
    await logAudit(adminClient, {
      userId: newUserId,
      action: "accept_invitation",
      entity: "invitations",
      entityId: invitation.id,
      newData: { email: invitation.email, role_id: invitation.role_id },
      ipAddress: getClientIp(req),
    });

    return jsonResponse({
      success: true,
      user: {
        id: newUserId,
        email: invitation.email,
        full_name: full_name.trim(),
      },
      message: "Account created successfully. Please sign in with your email and password.",
    }, 201);
  },
  { public: true },
);

serve(handler);
