export const PRIVACY_CONFIG = {
  // Supabase region should be sa-east-1 (Sao Paulo)
  dataRegion: "sa-east-1",

  // Data retention policies (in days)
  retention: {
    auditLogs: 365,
    rateLimitLogs: 30,
    sessionData: 30,
  },

  // PII fields that should never be logged
  piiFields: [
    "password",
    "access_token",
    "refresh_token",
    "client_secret",
    "email",
  ],
} as const;

/**
 * Strips PII fields from an object before logging.
 * Replaces sensitive values with "[REDACTED]".
 */
export function stripPii(
  obj: Record<string, unknown>
): Record<string, unknown> {
  const stripped = { ...obj };
  for (const field of PRIVACY_CONFIG.piiFields) {
    if (field in stripped) {
      stripped[field] = "[REDACTED]";
    }
  }
  return stripped;
}
