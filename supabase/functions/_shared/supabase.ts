import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Creates an admin Supabase client that bypasses RLS.
 * Use for service-level operations (creating users, cross-tenant queries, etc.)
 */
export function getAdminClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Creates a user-scoped Supabase client that respects RLS.
 * Pass the raw Authorization header from the incoming request.
 */
export function getUserClient(authHeader: string): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!url || !anonKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables");
  }

  return createClient(url, anonKey, {
    global: {
      headers: { Authorization: authHeader },
    },
  });
}
