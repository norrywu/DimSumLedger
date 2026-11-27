-- Riwayat mutasi stok manual (tambah / kurangi) oleh pengelola.
-- Penjualan dan pembatalan transaksi kasir tetap langsung mengubah `products.stok_pcs`
-- tanpa menulis baris ke tabel ini.
--
-- Penulisan hanya diizinkan lewat fungsi RPC `catat_stok`, `ubah_riwayat_stok`,
-- dan `hapus_riwayat_stok` supaya saldo `products.stok_pcs` selalu atomik dan sinkron.

create table public.riwayat_stok (
  id          uuid        primary key default gen_random_uuid(),
  product_id  uuid        references public.products (id) on delete set null,
  nama_produk text        not null,
  jenis       text        not null check (jenis in ('masuk', 'keluar')),
  jumlah_pcs  integer     not null check (jumlah_pcs > 0),
  catatan     text,
  tanggal     date        not null default current_date,
  pelaku_id   uuid        references public.profiles (id) on delete set null,
  pelaku_nama text        not null,
  created_at  timestamptz not null default now(),

  constraint riwayat_stok_nama_produk_check
    check (nama_produk = btrim(nama_produk) and length(nama_produk) between 1 and 50),
  constraint riwayat_stok_pelaku_nama_check
    check (pelaku_nama = btrim(pelaku_nama) and length(pelaku_nama) >= 1),
  constraint riwayat_stok_catatan_check
    check (
      (catatan is null or (catatan = btrim(catatan) and length(catatan) between 1 and 200))
      and (jenis <> 'keluar' or catatan is not null)
    )
);

create index riwayat_stok_tanggal_idx
  on public.riwayat_stok (tanggal desc, created_at desc);

create index riwayat_stok_product_idx
  on public.riwayat_stok (product_id, tanggal desc, created_at desc);

-- --- Keamanan -----------------------------------------------
alter table public.riwayat_stok enable row level security;

create policy "pengelola_baca_riwayat_stok" on public.riwayat_stok
  for select to authenticated
  using (internal.is_pengelola());

revoke all on table public.riwayat_stok from anon, authenticated;
grant select on table public.riwayat_stok to authenticated;
