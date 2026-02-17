import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { withMiddleware, AuthContext, checkIdempotency } from "../_shared/middleware.ts";
import { jsonResponse, ValidationError } from "../_shared/errors.ts";
import { logAudit, getClientIp } from "../_shared/audit.ts";
import { sendEmail, buildEmailHtml } from "../_shared/resend.ts";

/**
 * POST /auth-invite
 *
 * Invites a user by email. Creates an invitation record with a unique token
 * and sends the invitation email via Resend.
 *
 * Body: { email: string, role_id: string }
 * Requires: user_can(userId, 'users', 'create')
 */
const handler = withMiddleware(
  async (req: Request, ctx: AuthContext | null): Promise<Response> => {
    const { userId, adminClient } = ctx!;

    // Idempotency check
    await checkIdempotency(adminClient, req);

    // Parse and validate input
    const body = await req.json();
    const { email, role_id } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      throw new ValidationError("A valid email is required");
    }

    if (!role_id || typeof role_id !== "string") {
      throw new ValidationError("role_id is required");
    }

    // Verify role exists
    const { data: role, error: roleError } = await adminClient
      .from("roles")
      .select("id, name")
      .eq("id", role_id)
      .maybeSingle();

    if (roleError || !role) {
      throw new ValidationError("Invalid role_id: role not found");
    }

    // Check if there's already a pending invitation for this email
    const { data: existingInvite } = await adminClient
      .from("invitations")
      .select("id")
      .eq("email", email.toLowerCase())
      .is("accepted_at", null)
      .gte("expires_at", new Date().toISOString())
      .maybeSingle();

    if (existingInvite) {
      throw new ValidationError("An active invitation already exists for this email");
    }

    // Check if user already exists
    const { data: existingProfile } = await adminClient
      .from("user_profiles")
      .select("id")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (existingProfile) {
      throw new ValidationError("A user with this email already exists");
    }

    // Generate unique token
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // Create invitation record
    const { data: invitation, error: insertError } = await adminClient
      .from("invitations")
      .insert({
        email: email.toLowerCase(),
        role_id,
        invited_by: userId,
        token,
        expires_at: expiresAt,
      })
      .select("id, email, token, expires_at, created_at")
      .single();

    if (insertError) {
      console.error("Failed to create invitation:", insertError.message);
      throw new Error("Failed to create invitation");
    }

    // Send invitation email
    const appUrl = Deno.env.get("APP_URL") ?? "https://app.gtbi.com.br";
    const inviteLink = `${appUrl}/invite/accept?token=${token}`;

    await sendEmail({
      to: email.toLowerCase(),
      subject: "Voce foi convidado para o GTBI",
      html: buildEmailHtml(
        "Convite GTBI",
        `
        <h2>Voce foi convidado!</h2>
        <p>Voce recebeu um convite para acessar a plataforma GTBI com o perfil <strong>${role.name}</strong>.</p>
        <p>Clique no botao abaixo para aceitar o convite e criar sua conta:</p>
        <p style="text-align: center;">
          <a href="${inviteLink}" class="button">Aceitar Convite</a>
        </p>
        <p style="font-size: 13px; color: #666;">
          Este convite expira em 7 dias. Se voce nao solicitou este convite, ignore este email.
        </p>
        `,
      ),
    });

    // Audit log
    await logAudit(adminClient, {
      userId,
      action: "invite_user",
      entity: "invitations",
      entityId: invitation.id,
      newData: { email: email.toLowerCase(), role_id, role_name: role.name },
      ipAddress: getClientIp(req),
    });

    return jsonResponse({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        expires_at: invitation.expires_at,
        created_at: invitation.created_at,
      },
    }, 201);
  },
  { permission: ["users", "create"] },
);

serve(handler);
