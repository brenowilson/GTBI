import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { RateLimitError } from "./errors.ts";

export interface RateLimitConfig {
  /** Function identifier (e.g., "image-generate") */
  functionName: string;
  /** Maximum allowed requests in the time window */
  maxRequests: number;
  /** Time window in seconds (default: 60) */
  windowSeconds?: number;
}

/**
 * Checks if the user/ip has exceeded the rate limit for the given function.
 * Uses the admin client to read/write rate_limit_logs (service_role only table).
 *
 * @throws RateLimitError if limit is exceeded
 */
export async function checkRateLimit(
  adminClient: SupabaseClient,
  userId: string | null,
  ipAddress: string | null,
  config: RateLimitConfig,
): Promise<void> {
  const windowSeconds = config.windowSeconds ?? 60;
  const windowStart = new Date(Date.now() - windowSeconds * 1000).toISOString();

  // Count recent requests from this user or IP
  let query = adminClient
    .from("rate_limit_logs")
    .select("id", { count: "exact", head: true })
    .eq("function_name", config.functionName)
    .gte("created_at", windowStart);

  if (userId) {
    query = query.eq("user_id", userId);
  } else if (ipAddress) {
    query = query.eq("ip_address", ipAddress);
  } else {
    // No identifier to limit on — skip
    return;
  }

  const { count, error } = await query;

  if (error) {
    console.error("Rate limit check failed:", error.message);
    // Fail open — don't block the request if we can't check
    return;
  }

  if (count !== null && count >= config.maxRequests) {
    throw new RateLimitError(
      `Rate limit exceeded for ${config.functionName}. Max ${config.maxRequests} requests per ${windowSeconds}s.`,
    );
  }

  // Record this request
  await adminClient.from("rate_limit_logs").insert({
    user_id: userId,
    function_name: config.functionName,
    ip_address: ipAddress,
  });
}
