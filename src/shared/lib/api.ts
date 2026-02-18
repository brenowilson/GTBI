import { supabase } from "./supabase";
import { env } from "./env";

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

/**
 * Invokes a Supabase Edge Function using raw fetch to guarantee
 * correct Authorization header handling.
 */
export async function invokeFunction<T>(
  functionName: string,
  body?: Record<string, unknown>,
  options?: { method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"; headers?: Record<string, string> },
): Promise<ApiResponse<T>> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    console.error(`[api] ${functionName}: no session — user must re-login`);
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

    // Parse response — handle non-JSON gracefully
    let responseData: unknown;
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      responseData = await response.json();
    } else {
      const text = await response.text();
      console.error(`[api] ${functionName}: non-JSON response (${response.status}):`, text.slice(0, 500));
      responseData = { error: text || `HTTP ${response.status}` };
    }

    if (!response.ok) {
      const data = responseData as Record<string, unknown>;
      const errorObj = data?.error as Record<string, unknown> | string | undefined;
      const errorMessage = typeof errorObj === "object" && errorObj !== null
        ? (errorObj.message as string) ?? JSON.stringify(errorObj)
        : typeof errorObj === "string"
          ? errorObj
          : (data?.message as string) ?? (data?.msg as string) ?? `HTTP ${response.status}`;

      console.error(`[api] ${functionName} ${method} ${response.status}:`, {
        error: errorMessage,
        body: responseData,
      });
      return { data: null, error: errorMessage };
    }

    return { data: responseData as T, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Network error";
    console.error(`[api] ${functionName} exception:`, message);
    return { data: null, error: message };
  }
}
