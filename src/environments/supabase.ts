function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
export const supabasePublishableKey = requireEnv(
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
);
export const supabaseSecretKey = requireEnv("SUPABASE_SECRET_KEYS");
