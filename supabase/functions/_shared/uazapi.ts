import { ExternalServiceError } from "./errors.ts";
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

function getServerUrl(): string {
  const url = Deno.env.get("UAZAPI_SERVER_URL");
  if (!url) {
    throw new ExternalServiceError("Uazapi", "UAZAPI_SERVER_URL not configured");
  }
  return url.replace(/\/$/, "");
}

function getAdminToken(): string {
  const token = Deno.env.get("UAZAPI_ADMIN_TOKEN");
  if (!token) {
    throw new ExternalServiceError("Uazapi", "UAZAPI_ADMIN_TOKEN not configured");
  }
  return token;
}

// ---------------------------------------------------------------------------
// Instance management
// ---------------------------------------------------------------------------

export interface UazapiInstance {
  id: string;
  token: string;
  name: string;
  status: "disconnected" | "connecting" | "connected";
  profileName?: string;
  profilePicUrl?: string;
  isBusiness?: boolean;
  qrcode?: string;
  paircode?: string;
}

export interface InitInstanceResult {
  instance: UazapiInstance;
  token: string;
  connected: boolean;
  loggedIn: boolean;
}

/** Create a new WhatsApp instance (requires admintoken). */
export async function initInstance(name: string): Promise<InitInstanceResult> {
  const serverUrl = getServerUrl();
  const adminToken = getAdminToken();

  const response = await fetch(`${serverUrl}/instance/init`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      admintoken: adminToken,
    },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new ExternalServiceError("Uazapi", `Failed to create instance (${response.status}): ${errorText}`);
  }

  return await response.json();
}

export interface ConnectInstanceResult {
  connected: boolean;
  loggedIn: boolean;
  jid: unknown;
  instance: UazapiInstance;
}

/** Start QR code / pairing code authentication for an instance (requires instance token). */
export async function connectInstance(instanceToken: string, phone?: string): Promise<ConnectInstanceResult> {
  const serverUrl = getServerUrl();

  const body: Record<string, string> = {};
  if (phone) body.phone = phone;

  const response = await fetch(`${serverUrl}/instance/connect`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      token: instanceToken,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new ExternalServiceError("Uazapi", `Failed to connect instance (${response.status}): ${errorText}`);
  }

  return await response.json();
}

export interface InstanceStatusResult {
  instance: UazapiInstance;
  status: {
    connected: boolean;
    loggedIn: boolean;
    jid: unknown;
  };
}

/** Get current status of an instance (requires instance token). */
export async function getInstanceStatus(instanceToken: string): Promise<InstanceStatusResult> {
  const serverUrl = getServerUrl();

  const response = await fetch(`${serverUrl}/instance/status`, {
    method: "GET",
    headers: { token: instanceToken },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new ExternalServiceError("Uazapi", `Failed to get instance status (${response.status}): ${errorText}`);
  }

  return await response.json();
}

/** Disconnect an instance from WhatsApp (requires instance token). */
export async function disconnectInstance(instanceToken: string): Promise<void> {
  const serverUrl = getServerUrl();

  const response = await fetch(`${serverUrl}/instance/disconnect`, {
    method: "POST",
    headers: { token: instanceToken },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new ExternalServiceError("Uazapi", `Failed to disconnect instance (${response.status}): ${errorText}`);
  }
}

/** List all instances (requires admintoken). */
export async function listInstances(): Promise<UazapiInstance[]> {
  const serverUrl = getServerUrl();
  const adminToken = getAdminToken();

  const response = await fetch(`${serverUrl}/instance/all`, {
    method: "GET",
    headers: { admintoken: adminToken },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new ExternalServiceError("Uazapi", `Failed to list instances (${response.status}): ${errorText}`);
  }

  return await response.json();
}

// ---------------------------------------------------------------------------
// Webhook configuration
// ---------------------------------------------------------------------------

export interface WebhookConfig {
  enabled: boolean;
  url: string;
  events: string[];
  excludeMessages: string[];
}

/** Configure webhook for an instance (simple mode). */
export async function configureWebhook(instanceToken: string, config: WebhookConfig): Promise<void> {
  const serverUrl = getServerUrl();

  const response = await fetch(`${serverUrl}/webhook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      token: instanceToken,
    },
    body: JSON.stringify({
      enabled: config.enabled,
      url: config.url,
      events: config.events,
      excludeMessages: config.excludeMessages,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new ExternalServiceError("Uazapi", `Failed to configure webhook (${response.status}): ${errorText}`);
  }
}

// ---------------------------------------------------------------------------
// Message sending (requires a connected instance token)
// ---------------------------------------------------------------------------

/**
 * Retrieves the token of the first connected WhatsApp instance from the DB.
 * Falls back to UAZAPI_ADMIN_TOKEN if no instances are stored (backward compat).
 */
export async function getActiveInstanceToken(adminClient: SupabaseClient): Promise<string> {
  const { data, error } = await adminClient
    .from("whatsapp_instances")
    .select("instance_token")
    .eq("status", "connected")
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn("Failed to query whatsapp_instances, using admin token:", error.message);
    return getAdminToken();
  }

  if (!data?.instance_token) {
    console.warn("No connected WhatsApp instance found, using admin token");
    return getAdminToken();
  }

  return data.instance_token;
}

export interface SendWhatsAppMessageOptions {
  /** Phone number in international format (e.g., "5511999999999") */
  phone: string;
  /** Text message body */
  message: string;
}

export interface SendWhatsAppFileOptions {
  /** Phone number in international format */
  phone: string;
  /** File URL to send */
  fileUrl: string;
  /** Caption text */
  caption?: string;
  /** File name */
  fileName?: string;
}

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
}

/** Sends a text message via WhatsApp. */
export async function sendWhatsAppMessage(
  options: SendWhatsAppMessageOptions,
  instanceToken: string,
): Promise<WhatsAppSendResult> {
  const serverUrl = getServerUrl();

  const response = await fetch(`${serverUrl}/send/text`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      token: instanceToken,
    },
    body: JSON.stringify({
      number: options.phone,
      text: options.message,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new ExternalServiceError(
      "Uazapi",
      `WhatsApp message send failed (${response.status}): ${errorText}`,
    );
  }

  const data = await response.json();
  return {
    success: true,
    messageId: data.id ?? undefined,
  };
}

/** Sends a file (PDF, image, etc.) via WhatsApp. */
export async function sendWhatsAppFile(
  options: SendWhatsAppFileOptions,
  instanceToken: string,
): Promise<WhatsAppSendResult> {
  const serverUrl = getServerUrl();

  const response = await fetch(`${serverUrl}/send/media`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      token: instanceToken,
    },
    body: JSON.stringify({
      number: options.phone,
      type: "document",
      file: options.fileUrl,
      docName: options.fileName ?? "file",
      text: options.caption ?? "",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new ExternalServiceError(
      "Uazapi",
      `WhatsApp file send failed (${response.status}): ${errorText}`,
    );
  }

  const data = await response.json();
  return {
    success: true,
    messageId: data.id ?? undefined,
  };
}
