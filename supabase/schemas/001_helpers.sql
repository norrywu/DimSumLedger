-- Helper hak akses dipakai berulang oleh policy tabel master.
-- Diletakkan di schema `internal` supaya tidak ikut terekspos sebagai RPC
-- di Data API (yang hanya membaca schema `public`).

-- Sumber kebenaran role: klaim `app_metadata.role` di JWT, diisi trigger
-- `internal.sync_profile_to_auth`. Hanya service role yang bisa menulisnya,
-- jadi user tidak bisa menaikkan rolenya sendiri.
--
-- CATATAN: JWT bersifat snapshot. Perubahan role di `public.profiles` baru
-- terasa setelah token di-refresh (lihat `auth.jwt_expiry` di config.toml).
CREATE OR REPLACE FUNCTION internal.is_pengelola()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('owner', 'admin'),
    false
  );
$$;

-- Tanpa USAGE di schema `internal`, policy gagal memanggil fungsi ini.
GRANT USAGE ON SCHEMA internal TO authenticated;

REVOKE EXECUTE ON FUNCTION internal.is_pengelola() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION internal.is_pengelola() TO authenticated;
