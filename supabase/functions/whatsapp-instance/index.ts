import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { withMiddleware, AuthContext } from "../_shared/middleware.ts";
import { jsonResponse, ValidationError, NotFoundError } from "../_shared/errors.ts";
import { logAudit, getClientIp } from "../_shared/audit.ts";
import {
  initInstance,
  connectInstance,
  getInstanceStatus,
  disconnectInstance,
  configureWebhook,
} from "../_shared/uazapi.ts";
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * POST /whatsapp-instance
 *
 * Multi-action Edge Function for WhatsApp instance management.
 * Supports actions: create, connect, status, disconnect, delete.
 *
 * Requires: user_can(userId, 'users', 'create')
 */

async function getInstanceFromDb(
  adminClient: SupabaseClient,
  instanceId: string,
) {
  const { data, error } = await adminClient
    .from("whatsapp_instances")
    .select("*")
    .eq("id", instanceId)
    .maybeSingle();

  if (error || !data) {
    throw new NotFoundError("WhatsApp instance", instanceId);
  }

  return data;
}

const handler = withMiddleware(
  async (req: Request, ctx: AuthContext | null): Promise<Response> => {
    const { userId, adminClient } = ctx!;
    const body = await req.json();
    const { action } = body;

    if (!action || typeof action !== "string") {
      throw new ValidationError("action is required");
    }

    const ipAddress = getClientIp(req);

    switch (action) {
      // ---------------------------------------------------------------
      // CREATE — Initialize a new WhatsApp instance
      // ---------------------------------------------------------------
      case "create": {
        const { name } = body;

        if (!name || typeof name !== "string") {
          throw new ValidationError("name is required");
        }

        // Create instance via Uazapi
        const result = await initInstance(name);

        // Save to database
        const { data: instance, error: insertError } = await adminClient
          .from("whatsapp_instances")
          .insert({
            uazapi_instance_id: result.instance.id,
            instance_token: result.token,
            name,
            status: "disconnected",
            created_by: userId,
          })
          .select(
            "id, uazapi_instance_id, name, status, phone_number, profile_name, is_business, webhook_url, webhook_enabled, created_by, created_at, updated_at",
          )
          .single();

        if (insertError) {
          console.error(
            "Failed to create whatsapp instance:",
            insertError.message,
          );
          throw new Error("Failed to create WhatsApp instance");
        }

        await logAudit(adminClient, {
          userId,
          action: "create_whatsapp_instance",
          entity: "whatsapp_instances",
          entityId: instance.id,
          newData: { name, uazapi_instance_id: result.instance.id },
          ipAddress,
        });

        return jsonResponse({ success: true, instance }, 201);
      }

      // ---------------------------------------------------------------
      // CONNECT — Start QR code / pairing code authentication
      // ---------------------------------------------------------------
      case "connect": {
        const { instance_id, phone } = body;

        if (!instance_id || typeof instance_id !== "string") {
          throw new ValidationError("instance_id is required");
        }

        const dbInstance = await getInstanceFromDb(adminClient, instance_id);
        const result = await connectInstance(dbInstance.instance_token, phone);

        // Update status to connecting
        await adminClient
          .from("whatsapp_instances")
          .update({ status: "connecting" })
          .eq("id", instance_id);

        await logAudit(adminClient, {
          userId,
          action: "connect_whatsapp_instance",
          entity: "whatsapp_instances",
          entityId: instance_id,
          newData: { phone: phone ?? null },
          ipAddress,
        });

        return jsonResponse({
          success: true,
          qrcode: result.instance.qrcode ?? null,
          paircode: result.instance.paircode ?? null,
        });
      }

      // ---------------------------------------------------------------
      // STATUS — Check instance status and auto-configure webhook
      // ---------------------------------------------------------------
      case "status": {
        const { instance_id } = body;

        if (!instance_id || typeof instance_id !== "string") {
          throw new ValidationError("instance_id is required");
        }

        const dbInstance = await getInstanceFromDb(adminClient, instance_id);
        const result = await getInstanceStatus(dbInstance.instance_token);

        // Determine new status
        let newStatus: "disconnected" | "connecting" | "connected" =
          "disconnected";
        if (result.status.connected && result.status.loggedIn) {
          newStatus = "connected";
        } else if (result.status.connected || result.instance.qrcode) {
          newStatus = "connecting";
        }

        // Build update payload
        const updatePayload: Record<string, unknown> = {
          status: newStatus,
        };

        if (result.instance.profileName) {
          updatePayload.profile_name = result.instance.profileName;
        }

        if (result.instance.isBusiness !== undefined) {
          updatePayload.is_business = result.instance.isBusiness;
        }

        // Extract phone from JID if available
        const jid = result.status.jid;
        if (jid && typeof jid === "string" && jid.includes("@")) {
          updatePayload.phone_number = jid.split("@")[0];
        }

        // Auto-configure webhook when instance becomes connected
        if (
          newStatus === "connected" &&
          dbInstance.status !== "connected"
        ) {
          try {
            const supabaseUrl = Deno.env.get("SUPABASE_URL");
            const webhookUrl = `${supabaseUrl}/functions/v1/whatsapp-webhook`;

            await configureWebhook(dbInstance.instance_token, {
              enabled: true,
              url: webhookUrl,
              events: ["messages", "connection"],
              excludeMessages: ["wasSentByApi"],
            });

            updatePayload.webhook_url = webhookUrl;
            updatePayload.webhook_enabled = true;

            console.log(
              `Webhook configured for instance ${instance_id}: ${webhookUrl}`,
            );
          } catch (webhookError) {
            console.error(
              "Failed to configure webhook:",
              webhookError,
            );
            // Don't fail the status check if webhook configuration fails
          }
        }

        // Update database if status changed
        if (newStatus !== dbInstance.status || Object.keys(updatePayload).length > 1) {
          await adminClient
            .from("whatsapp_instances")
            .update(updatePayload)
            .eq("id", instance_id);
        }

        await logAudit(adminClient, {
          userId,
          action: "check_whatsapp_instance_status",
          entity: "whatsapp_instances",
          entityId: instance_id,
          newData: { status: newStatus },
          ipAddress,
        });

        return jsonResponse({
          success: true,
          instance: {
            id: dbInstance.id,
            name: dbInstance.name,
            status: newStatus,
            phone_number: updatePayload.phone_number ?? dbInstance.phone_number,
            profile_name: updatePayload.profile_name ?? dbInstance.profile_name,
            is_business: updatePayload.is_business ?? dbInstance.is_business,
            webhook_url: updatePayload.webhook_url ?? dbInstance.webhook_url,
            webhook_enabled:
              updatePayload.webhook_enabled ?? dbInstance.webhook_enabled,
          },
          qrcode: result.instance.qrcode ?? null,
          paircode: result.instance.paircode ?? null,
        });
      }

      // ---------------------------------------------------------------
      // DISCONNECT — Disconnect instance from WhatsApp
      // ---------------------------------------------------------------
      case "disconnect": {
        const { instance_id } = body;

        if (!instance_id || typeof instance_id !== "string") {
          throw new ValidationError("instance_id is required");
        }

        const dbInstance = await getInstanceFromDb(adminClient, instance_id);
        await disconnectInstance(dbInstance.instance_token);

        // Update database
        await adminClient
          .from("whatsapp_instances")
          .update({
            status: "disconnected",
            phone_number: null,
            profile_name: null,
          })
          .eq("id", instance_id);

        await logAudit(adminClient, {
          userId,
          action: "disconnect_whatsapp_instance",
          entity: "whatsapp_instances",
          entityId: instance_id,
          oldData: {
            status: dbInstance.status,
            phone_number: dbInstance.phone_number,
          },
          ipAddress,
        });

        return jsonResponse({ success: true });
      }

      // ---------------------------------------------------------------
      // DELETE — Remove instance entirely
      // ---------------------------------------------------------------
      case "delete": {
        const { instance_id } = body;

        if (!instance_id || typeof instance_id !== "string") {
          throw new ValidationError("instance_id is required");
        }

        const dbInstance = await getInstanceFromDb(adminClient, instance_id);

        // Disconnect first if connected
        if (dbInstance.status !== "disconnected") {
          try {
            await disconnectInstance(dbInstance.instance_token);
          } catch (disconnectError) {
            console.error(
              "Failed to disconnect before delete:",
              disconnectError,
            );
            // Continue with deletion even if disconnect fails
          }
        }

        // Delete from database
        const { error: deleteError } = await adminClient
          .from("whatsapp_instances")
          .delete()
          .eq("id", instance_id);

        if (deleteError) {
          console.error(
            "Failed to delete whatsapp instance:",
            deleteError.message,
          );
          throw new Error("Failed to delete WhatsApp instance");
        }

        await logAudit(adminClient, {
          userId,
          action: "delete_whatsapp_instance",
          entity: "whatsapp_instances",
          entityId: instance_id,
          oldData: {
            name: dbInstance.name,
            uazapi_instance_id: dbInstance.uazapi_instance_id,
            status: dbInstance.status,
          },
          ipAddress,
        });

        return jsonResponse({ success: true });
      }

      default:
        throw new ValidationError(
          `Unknown action: ${action}. Valid actions: create, connect, status, disconnect, delete`,
        );
    }
  },
  { permission: ["users", "create"] },
);

serve(handler);
