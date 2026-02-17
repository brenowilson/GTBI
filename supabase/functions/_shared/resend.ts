import { ExternalServiceError } from "./errors.ts";

const RESEND_API_URL = "https://api.resend.com";

function getApiKey(): string {
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) {
    throw new ExternalServiceError("Resend", "RESEND_API_KEY not configured");
  }
  return key;
}

function getFromEmail(): string {
  return Deno.env.get("RESEND_FROM_EMAIL") ?? "GTBI <noreply@gtbi.com.br>";
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  /** Plain text alternative */
  text?: string;
  /** Override default from address */
  from?: string;
  /** File attachments */
  attachments?: Array<{
    filename: string;
    content: string; // base64 encoded
    content_type?: string;
  }>;
}

export interface SendEmailResult {
  id: string;
}

/**
 * Sends an email via the Resend API.
 */
export async function sendEmail(
  options: SendEmailOptions,
): Promise<SendEmailResult> {
  const apiKey = getApiKey();

  const payload: Record<string, unknown> = {
    from: options.from ?? getFromEmail(),
    to: Array.isArray(options.to) ? options.to : [options.to],
    subject: options.subject,
    html: options.html,
  };

  if (options.text) {
    payload.text = options.text;
  }

  if (options.attachments && options.attachments.length > 0) {
    payload.attachments = options.attachments;
  }

  const response = await fetch(`${RESEND_API_URL}/emails`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new ExternalServiceError(
      "Resend",
      `Email send failed (${response.status}): ${errorText}`,
    );
  }

  const data = await response.json();
  return { id: data.id };
}

/**
 * Builds a styled HTML email wrapper for GTBI emails.
 */
export function buildEmailHtml(title: string, bodyHtml: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; margin-top: 20px; margin-bottom: 20px; }
    .header { background-color: #1a1a2e; color: #ffffff; padding: 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 32px 24px; color: #333333; line-height: 1.6; }
    .button { display: inline-block; background-color: #e94560; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0; }
    .footer { background-color: #f5f5f5; padding: 16px 24px; text-align: center; font-size: 12px; color: #999999; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>GTBI</h1>
    </div>
    <div class="content">
      ${bodyHtml}
    </div>
    <div class="footer">
      <p>GTBI - Gestao Total Business Intelligence</p>
    </div>
  </div>
</body>
</html>`.trim();
}
