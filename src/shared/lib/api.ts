import { supabase } from "./supabase";

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export async function invokeFunction<T>(
  functionName: string,
  body?: Record<string, unknown>,
  options?: { method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"; headers?: Record<string, string> },
): Promise<ApiResponse<T>> {
  // Explicitly fetch the session token to avoid race condition where
  // supabase.functions.invoke() may use the anon key if the session
  // hasn't loaded from localStorage yet.
  const { data: { session } } = await supabase.auth.getSession();

  const invokeOptions: Record<string, unknown> = {};
  if (body !== undefined) invokeOptions.body = body;
  if (options?.method) invokeOptions.method = options.method;
  invokeOptions.headers = {
    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    ...options?.headers,
  };

  const { data, error } = await supabase.functions.invoke(functionName, invokeOptions);

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as T, error: null };
}
