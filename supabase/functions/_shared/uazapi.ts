import { ExternalServiceError } from "./errors.ts";

function getServerUrl(): string {
  const url = Deno.env.get("UAZAPI_SERVER_URL");
  if (!url) {
    throw new ExternalServiceError("Uazapi", "UAZAPI_SERVER_URL not configured");
  }
  // Remove trailing slash
  return url.replace(/\/$/, "");
}

function getAdminToken(): string {
  const token = Deno.env.get("UAZAPI_ADMIN_TOKEN");
  if (!token) {
    throw new ExternalServiceError("Uazapi", "UAZAPI_ADMIN_TOKEN not configured");
  }
  return token;
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

/**
 * Sends a text message via WhatsApp using the Uazapi API.
 */
export async function sendWhatsAppMessage(
  options: SendWhatsAppMessageOptions,
): Promise<WhatsAppSendResult> {
  const serverUrl = getServerUrl();
  const token = getAdminToken();

  const response = await fetch(`${serverUrl}/sendText`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      admin_token: token,
    },
    body: JSON.stringify({
      phone: options.phone,
      message: options.message,
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
    messageId: data.messageId ?? data.id ?? undefined,
  };
}

/**
 * Sends a file (PDF, image, etc.) via WhatsApp using the Uazapi API.
 */
export async function sendWhatsAppFile(
  options: SendWhatsAppFileOptions,
): Promise<WhatsAppSendResult> {
  const serverUrl = getServerUrl();
  const token = getAdminToken();

  const response = await fetch(`${serverUrl}/sendFile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      admin_token: token,
    },
    body: JSON.stringify({
      phone: options.phone,
      url: options.fileUrl,
      caption: options.caption ?? "",
      fileName: options.fileName ?? "file",
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
    messageId: data.messageId ?? data.id ?? undefined,
  };
}
