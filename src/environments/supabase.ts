/**
 * Nilai dioper sebagai argumen, BUKAN nama variabelnya.
 *
 * Next.js tidak membaca env var di browser — ia mengganti teks
 * `process.env.NEXT_PUBLIC_FOO` yang literal dengan nilainya saat build.
 * Penulisan dinamis seperti `process.env[name]` tidak bisa ditemukan bundler,
 * jadi nilainya selalu `undefined` di browser. Karena itu pemanggil wajib
 * menulis `process.env.NAMA_LITERAL` sendiri; `name` di sini cuma untuk pesan
 * error.
 */
function requireEnv(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export const supabaseUrl = requireEnv(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  "NEXT_PUBLIC_SUPABASE_URL",
);

export const supabasePublishableKey = requireEnv(
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
);
