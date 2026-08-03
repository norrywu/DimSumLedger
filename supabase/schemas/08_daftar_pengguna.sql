-- Daftar pengguna untuk halaman /APP/admin/users.
--
-- Ada sebagai fungsi, bukan query biasa ke `public.profiles`, karena dua hal
-- yang tidak bisa diselesaikan policy:
--
-- 1. Policy SELECT `profiles` hanya "Users can read own profile", jadi
--    `.from("profiles").select()` dari browser selalu mengembalikan satu baris
--    — milik si pemanggil sendiri.
-- 2. Email tinggal di `auth.users`, bukan di `profiles`. Tanpa email, dua akun
--    bernama sama tidak bisa dibedakan pengelola.
--
-- Di schema `public`, sama alasannya dengan `simpan_varian`: yang di `internal`
-- sengaja disembunyikan dari Data API, yang ini memang harus terpanggil sebagai
-- RPC.
CREATE OR REPLACE FUNCTION public.daftar_pengguna()
RETURNS TABLE (
  id              uuid,
  name            text,
  role            text,
  email           text,
  created_at      timestamptz,
  last_sign_in_at timestamptz
)
LANGUAGE plpgsql
-- SECURITY DEFINER, kebalikan dari `simpan_varian`: `auth.users` memang tidak
-- boleh terbaca `authenticated`. Karena RLS ikut terlewati, penjagaannya pindah
-- ke badan fungsi — baris IF di bawah TIDAK boleh dihapus, tanpa itu kasir bisa
-- memanen seluruh alamat email lewat pintu ini.
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT internal.is_pengelola() THEN
    RAISE EXCEPTION 'Kamu tidak punya akses melihat daftar pengguna.';
  END IF;

  RETURN QUERY
  -- JOIN, bukan LEFT JOIN: `profiles.id` punya FK ke `auth.users` dengan
  -- ON DELETE CASCADE, jadi baris profil tanpa akun auth tidak mungkin ada.
  --
  -- `auth.users.email` bertipe varchar(255); tanpa cast, Postgres menolak
  -- fungsinya karena tidak cocok dengan `text` di RETURNS TABLE.
  SELECT p.id, p.name, p.role, u.email::text, p.created_at, u.last_sign_in_at
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.id
   ORDER BY p.name;
END;
$$;

-- --- Keamanan -----------------------------------------------
REVOKE EXECUTE ON FUNCTION public.daftar_pengguna() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.daftar_pengguna() TO authenticated;
