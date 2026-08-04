-- Membatalkan satu transaksi.
--
-- SECURITY INVOKER, kebalikan dari `simpan_transaksi` — di sini justru RLS yang
-- jadi aturannya: policy `kasir_batalkan_transaksi_baru` yang memutuskan siapa
-- boleh membatalkan apa, dan `pengelola_akses_penuh` yang membebaskan pengelola.
-- Fungsi ini tidak menambah wewenang apa pun, hanya membungkusnya.
--
-- Dibungkus RPC dan bukan update langsung dari client karena dua alasan:
-- `dibatalkan_at` harus memakai jam SERVER (client bisa mengirim jam apa saja),
-- dan update yang ditolak RLS mengembalikan "0 baris" tanpa penjelasan — kasir
-- perlu tahu apakah notanya sudah dibatalkan atau jendelanya sudah lewat.
create or replace function public.batalkan_transaksi(p_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_status text;
begin
  -- Policy SELECT kasir tidak dibatasi waktu, jadi baris yang tidak terbaca
  -- di sini benar-benar bukan miliknya — bukan sekadar kedaluwarsa.
  select status into v_status
    from public.transaksi
   where id = p_id;

  if not found then
    raise exception 'Transaksi tidak ditemukan.';
  end if;

  if v_status = 'dibatalkan' then
    raise exception 'Transaksi ini sudah dibatalkan.';
  end if;

  update public.transaksi
     set status = 'dibatalkan', dibatalkan_at = now()
   where id = p_id;

  -- Terbaca tapi tidak terupdate berarti policy UPDATE yang menolak, dan
  -- satu-satunya syarat yang bisa gagal di titik ini adalah umur notanya.
  if not found then
    raise exception 'Batas waktu pembatalan sudah lewat. Minta pengelola untuk membatalkannya.';
  end if;
end;
$$;

-- --- Keamanan -----------------------------------------------
revoke execute on function public.batalkan_transaksi(uuid) from public, anon;
grant execute on function public.batalkan_transaksi(uuid) to authenticated;
