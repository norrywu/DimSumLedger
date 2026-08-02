-- Menyimpan varian BESERTA daftar kemasannya dalam satu transaksi.
--
-- Ada di sini, bukan di kode aplikasi, karena supabase-js tidak bisa
-- membungkus dua penulisan jadi satu transaksi. Kalau `variants` dan
-- `variant_packagings` ditulis lewat dua panggilan berurutan, selalu ada jeda
-- di mana varian sudah ada tapi kemasannya belum — dan varian seperti itu
-- modal kemasannya terbaca 0, sehingga marginnya tampak lebih besar dari yang
-- sebenarnya. Justru angka itu yang dipakai pemilik menentukan harga.
--
-- Di schema `public`, kebalikan dari `internal.is_pengelola()`: yang di
-- `internal` sengaja disembunyikan dari Data API, yang ini memang harus
-- terpanggil sebagai RPC.
CREATE OR REPLACE FUNCTION public.simpan_varian(
  p_id          uuid,      -- NULL = tambah baru
  p_product_id  uuid,
  p_nama        text,
  p_jumlah_pcs  smallint,  -- NULL = jumlah pcs belum diketahui
  p_harga_jual  numeric,
  p_modal_bahan numeric,
  p_aktif       boolean,
  p_kemasan     jsonb      -- [{"packaging_id": "...", "jumlah": 1}, ...]
)
RETURNS uuid
LANGUAGE plpgsql
-- SECURITY INVOKER (default, JANGAN diubah jadi DEFINER): RLS
-- `pengelola_akses_penuh` harus tetap berlaku atas nama pemanggil. Dengan
-- DEFINER, kasir bisa menulis varian lewat pintu ini.
SET search_path = ''
AS $$
DECLARE
  v_id uuid;
BEGIN
  -- Inti aturannya: varian tanpa kemasan bukan barang yang bisa dijual.
  IF p_kemasan IS NULL OR jsonb_array_length(p_kemasan) < 1 THEN
    RAISE EXCEPTION 'Varian wajib punya minimal satu kemasan.';
  END IF;

  -- Tanpa penjagaan ini, ON CONFLICT DO UPDATE di bawah melempar 21000
  -- ("cannot affect row a second time") yang tidak bisa dibaca siapa pun.
  -- UI sudah menyaring pilihan yang sudah dipakai; ini jaring pengaman.
  IF (SELECT count(*) FROM jsonb_array_elements(p_kemasan)) <> (
       SELECT count(DISTINCT baris->>'packaging_id')
         FROM jsonb_array_elements(p_kemasan) baris
     ) THEN
    RAISE EXCEPTION 'Kemasan tidak boleh kembar dalam satu varian.';
  END IF;

  IF p_id IS NULL THEN
    INSERT INTO public.variants
      (product_id, nama, jumlah_pcs, harga_jual, modal_bahan, aktif)
    VALUES
      (p_product_id, p_nama, p_jumlah_pcs, p_harga_jual, p_modal_bahan, p_aktif)
    RETURNING id INTO v_id;
  ELSE
    UPDATE public.variants
       SET product_id  = p_product_id,
           nama        = p_nama,
           jumlah_pcs  = p_jumlah_pcs,
           harga_jual  = p_harga_jual,
           modal_bahan = p_modal_bahan,
           aktif       = p_aktif
     WHERE id = p_id
    RETURNING id INTO v_id;

    -- Nol baris terpengaruh: barisnya keburu dihapus orang lain, atau RLS
    -- menyembunyikannya. Tanpa cek ini, daftar kemasan di bawah akan ditulis
    -- untuk variant_id NULL dan gagal dengan pesan yang membingungkan.
    IF v_id IS NULL THEN
      RAISE EXCEPTION 'Varian sudah tidak ada. Muat ulang halaman.';
    END IF;
  END IF;

  -- Daftar kemasannya diganti total, bukan ditambal: yang hilang dari kiriman
  -- berarti memang dicabut pengguna.
  --
  -- NOT EXISTS, bukan `packaging_id NOT IN (...)` — NOT IN diam-diam
  -- mengembalikan nol baris begitu ada satu NULL di dalam daftarnya.
  DELETE FROM public.variant_packagings vp
   WHERE vp.variant_id = v_id
     AND NOT EXISTS (
       SELECT 1
         FROM jsonb_array_elements(p_kemasan) baris
        WHERE (baris->>'packaging_id')::uuid = vp.packaging_id
     );

  INSERT INTO public.variant_packagings (variant_id, packaging_id, jumlah)
  SELECT v_id,
         (baris->>'packaging_id')::uuid,
         (baris->>'jumlah')::smallint
    FROM jsonb_array_elements(p_kemasan) baris
      ON CONFLICT (variant_id, packaging_id)
      DO UPDATE SET jumlah = excluded.jumlah;

  RETURN v_id;
END;
$$;

-- --- Keamanan -----------------------------------------------
REVOKE EXECUTE ON FUNCTION public.simpan_varian(
  uuid, uuid, text, smallint, numeric, numeric, boolean, jsonb
) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.simpan_varian(
  uuid, uuid, text, smallint, numeric, numeric, boolean, jsonb
) TO authenticated;
