function getEnvVar(key: string): string {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value as string;
}

export const env = {
  supabase: {
    url: getEnvVar("VITE_SUPABASE_URL"),
    anonKey: getEnvVar("VITE_SUPABASE_ANON_KEY"),
  },
  app: {
    url: import.meta.env.VITE_APP_URL ?? "http://localhost:5173",
  },
} as const;
