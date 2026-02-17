/**
 * Standard CORS headers for all Edge Functions.
 * Allows requests from any origin with common auth/content headers.
 */
export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-idempotency-key",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
};

/**
 * Creates a preflight OPTIONS response with CORS headers.
 */
export function handleCorsPreFlight(): Response {
  return new Response("ok", { headers: corsHeaders });
}
