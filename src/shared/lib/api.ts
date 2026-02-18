import { supabase } from "./supabase";
import { env } from "./env";

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

/**
 * Invokes a Supabase Edge Function using raw fetch to guarantee
 * the Authorization header is set correctly. The supabase.functions.invoke()
 * wrapper has a customFetch that can overwrite headers, causing 401s.
 */
export async function invokeFunction<T>(
  functionName: string,
  body?: Record<string, unknown>,
  options?: { method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"; headers?: Record<string, string> },
): Promise<ApiResponse<T>> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    console.error(`[invokeFunction] No session token available for ${functionName}`);
    return { data: null, error: "Sessao expirada. Faca login novamente." };
  }

  const url = `${env.supabase.url}/functions/v1/${functionName}`;
  const method = options?.method ?? "POST";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: env.supabase.anonKey,
    Authorization: `Bearer ${session.access_token}`,
    ...options?.headers,
  };

  const fetchOptions: RequestInit = { method, headers };
  if (body !== undefined && method !== "GET") {
    fetchOptions.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, fetchOptions);
    const responseData = await response.json();

    if (!response.ok) {
      const errorMessage = responseData?.error?.message
        ?? responseData?.error
        ?? `HTTP ${response.status}`;
      console.error(`[invokeFunction] ${method} ${functionName} failed:`, {
        status: response.status,
        error: errorMessage,
      });
      return { data: null, error: errorMessage };
    }

    return { data: responseData as T, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Network error";
    console.error(`[invokeFunction] ${method} ${functionName} exception:`, message);
    return { data: null, error: message };
  }
}
