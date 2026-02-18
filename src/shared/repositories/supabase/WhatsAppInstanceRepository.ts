import { supabase } from "@/shared/lib/supabase";
import { invokeFunction } from "@/shared/lib/api";
import type { IWhatsAppInstanceRepository, ConnectResult, StatusResult } from "../interfaces/IWhatsAppInstanceRepository";
import type { WhatsAppInstance } from "@/entities/whatsapp-instance";

export class SupabaseWhatsAppInstanceRepository implements IWhatsAppInstanceRepository {
  async getAll(): Promise<WhatsAppInstance[]> {
    const { data, error } = await supabase
      .from("whatsapp_instances")
      .select("id, uazapi_instance_id, name, status, phone_number, profile_name, is_business, webhook_url, webhook_enabled, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async create(name: string): Promise<WhatsAppInstance> {
    const { data, error } = await invokeFunction<{ success: boolean; instance: WhatsAppInstance }>(
      "whatsapp-instance",
      { action: "create", name },
    );
    if (error) throw new Error(error);
    return data!.instance;
  }

  async connect(instanceId: string, phone?: string): Promise<ConnectResult> {
    const body: Record<string, unknown> = { action: "connect", instance_id: instanceId };
    if (phone) body.phone = phone;

    const { data, error } = await invokeFunction<ConnectResult>(
      "whatsapp-instance",
      body,
    );
    if (error) throw new Error(error);
    return data!;
  }

  async getStatus(instanceId: string): Promise<StatusResult> {
    const { data, error } = await invokeFunction<StatusResult>(
      "whatsapp-instance",
      { action: "status", instance_id: instanceId },
    );
    if (error) throw new Error(error);
    return data!;
  }

  async disconnect(instanceId: string): Promise<void> {
    const { error } = await invokeFunction(
      "whatsapp-instance",
      { action: "disconnect", instance_id: instanceId },
    );
    if (error) throw new Error(error);
  }

  async remove(instanceId: string): Promise<void> {
    const { error } = await invokeFunction(
      "whatsapp-instance",
      { action: "delete", instance_id: instanceId },
    );
    if (error) throw new Error(error);
  }
}

export const whatsappInstanceRepository = new SupabaseWhatsAppInstanceRepository();
