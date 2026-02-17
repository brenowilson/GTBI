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
  const { data, error } = await supabase.functions.invoke(functionName, {
    body,
    method: options?.method,
    headers: options?.headers,
  });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as T, error: null };
}
