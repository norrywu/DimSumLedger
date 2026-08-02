import "server-only";

/**
 * Kunci rahasia Supabase — menembus semua RLS, jadi HANYA boleh dipakai di
 * Server Component, Server Action, atau Route Handler.
 *
 * Sengaja dipisah dari `./supabase` dan TIDAK direekspor lewat
 * `@/environments`: modul itu ikut terbawa ke bundel browser lewat
 * `@/lib/supabase/client`. Import file ini langsung dengan path lengkapnya,
 * dan jangan pernah dari komponen berlabel "use client".
 *
 * Belum ada pemakainya saat ini.
 */
function requireEnv(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export const supabaseSecretKey = requireEnv(
  process.env.SUPABASE_SECRET_KEYS,
  "SUPABASE_SECRET_KEYS",
);
