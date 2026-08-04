-- Rekap penjualan per varian untuk satu rentang waktu.
--
-- Diagregasi di database, bukan di browser: tanpa ini klien harus menarik satu
-- baris per item terjual lalu menjumlahkannya sendiri — sebulan penjualan bisa
-- ribuan baris hanya untuk menampilkan belasan angka.
--
-- SECURITY INVOKER, dan `v_penjualan_item` juga `security_invoker`, jadi RLS
-- tetap berlaku berantai: pengelola melihat semuanya, kasir hanya notanya
-- sendiri. Fungsi ini tidak menambah wewenang apa pun.
--
-- `p_sampai` dibandingkan dengan `<`, bukan `<=`, supaya pemanggil cukup
-- mengirim awal hari berikutnya tanpa memikirkan detik terakhir.
create or replace function public.laporan_penjualan(
  p_dari   timestamptz,
  p_sampai timestamptz
)
returns table (
  nama_produk   text,
  nama_varian   text,
  porsi         bigint,
  omzet         numeric,
  modal_bahan   numeric,
  modal_kemasan numeric,
  modal_extra   numeric,
  modal         numeric,
  laba          numeric
)
language sql
stable
security invoker
set search_path = ''
as $$
  select v.nama_produk,
         v.nama_varian,
         sum(v.qty)::bigint,
         sum(v.omzet),
         sum(v.modal_bahan),
         sum(v.modal_kemasan),
         sum(v.modal_extra),
         sum(v.modal),
         sum(v.laba)
    from public.v_penjualan_item v
   -- Transaksi yang dibatalkan tidak pernah jadi omzet.
   where v.status = 'selesai'
     and v.created_at >= p_dari
     and v.created_at <  p_sampai
   group by v.nama_produk, v.nama_varian
   order by sum(v.omzet) desc;
$$;

-- --- Keamanan -----------------------------------------------
revoke execute on function public.laporan_penjualan(timestamptz, timestamptz)
  from public, anon;
grant execute on function public.laporan_penjualan(timestamptz, timestamptz)
  to authenticated;
