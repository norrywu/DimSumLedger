create table public.transaksi (
  id            uuid          primary key default gen_random_uuid(),
  kasir_id      uuid          references public.profiles (id) on delete set null,
  kasir_nama    text          not null,
 
  status        text          not null default 'selesai' check (status in ('selesai', 'dibatalkan')),
  total         numeric(12,2) not null check (total >= 0),
  dibayar       numeric(12,2) not null default 0 check (dibayar >= 0),
  created_at    timestamptz   not null default now(),
  dibatalkan_at timestamptz,

  constraint transaksi_kasir_nama_check
    check (kasir_nama = btrim(kasir_nama) and length(kasir_nama) >= 1),
  constraint transaksi_batal_check
    check ((status = 'dibatalkan') = (dibatalkan_at is not null)),
  -- Menjaga `kembalian` tidak pernah negatif tanpa perlu constraint terpisah.
  constraint transaksi_bayar_check
    check (dibayar >= total)
);

create index transaksi_created_idx on public.transaksi (created_at desc);
create index transaksi_kasir_idx   on public.transaksi (kasir_id);

create table public.transaksi_item (
  id           uuid          primary key default gen_random_uuid(),
  transaksi_id uuid          not null references public.transaksi (id) on delete cascade,
  variant_id   uuid          references public.variants (id) on delete set null,
  nama_produk  text          not null,
  nama_varian  text          not null,
  jumlah_pcs   smallint      check (jumlah_pcs > 0),
  harga_satuan numeric(12,2) not null check (harga_satuan >= 0),

  modal_bahan_satuan   numeric(12,2) not null check (modal_bahan_satuan   >= 0),
  modal_kemasan_satuan numeric(12,2) not null check (modal_kemasan_satuan >= 0),

  -- Turunan, bukan angka yang disimpan sendiri: mustahil melenceng dari komponennya.
  hpp_satuan numeric(12,2) not null
    generated always as (modal_bahan_satuan + modal_kemasan_satuan) stored,

  qty          smallint      not null check (qty > 0)
);

create index transaksi_item_transaksi_idx on public.transaksi_item (transaksi_id);
create index transaksi_item_variant_idx   on public.transaksi_item (variant_id);

create table public.transaksi_item_modifier (
  id                uuid          primary key default gen_random_uuid(),
  transaksi_item_id uuid          not null references public.transaksi_item (id) on delete cascade,
  modifier_id       uuid          references public.modifiers (id) on delete set null,
  nama              text          not null,
  tambahan_harga    numeric(12,2) not null check (tambahan_harga >= 0),
  tambahan_modal    numeric(12,2) not null check (tambahan_modal >= 0),

  unique (transaksi_item_id, modifier_id)
);

-- --- Keamanan -----------------------------------------------
alter table public.transaksi               enable row level security;
alter table public.transaksi_item          enable row level security;
alter table public.transaksi_item_modifier enable row level security;

create policy "pengelola_akses_penuh" on public.transaksi
  for all to authenticated
  using (internal.is_pengelola())
  with check (internal.is_pengelola());

create policy "kasir_catat_transaksi" on public.transaksi
  for insert to authenticated
  with check (kasir_id = (select auth.uid()));

create policy "kasir_baca_transaksi_sendiri" on public.transaksi
  for select to authenticated
  using (kasir_id = (select auth.uid()));

-- Jendela 10 menit. Salah pencet ketahuan dalam hitungan detik, jadi kasir
-- tidak butuh lebih; yang dicegah adalah membatalkan nota lama saat toko sepi
-- lalu mengambil tunainya — omzet ikut turun sehingga selisih laci tidak
-- ketahuan. Lewat itu, pembatalan jadi wewenang pengelola.
--
-- `with check` mengunci arahnya satu jalur: kasir hanya bisa membuat baris
-- menjadi 'dibatalkan', tidak bisa menghidupkannya kembali.
create policy "kasir_batalkan_transaksi_baru" on public.transaksi
  for update to authenticated
  using (
    kasir_id = (select auth.uid())
    and status = 'selesai'
    and created_at > now() - interval '10 minutes'
  )
  with check (
    kasir_id = (select auth.uid())
    and status = 'dibatalkan'
  );

create policy "baca_ikut_induk" on public.transaksi_item
  for select to authenticated
  using (exists (select 1 from public.transaksi t where t.id = transaksi_id));

create policy "tulis_ikut_induk" on public.transaksi_item
  for insert to authenticated
  with check (exists (select 1 from public.transaksi t where t.id = transaksi_id));

create policy "baca_ikut_induk" on public.transaksi_item_modifier
  for select to authenticated
  using (exists (select 1 from public.transaksi_item i where i.id = transaksi_item_id));

create policy "tulis_ikut_induk" on public.transaksi_item_modifier
  for insert to authenticated
  with check (exists (select 1 from public.transaksi_item i where i.id = transaksi_item_id));

revoke all on table public.transaksi               from anon, authenticated;
revoke all on table public.transaksi_item          from anon, authenticated;
revoke all on table public.transaksi_item_modifier from anon, authenticated;

grant select, insert                  on table public.transaksi to authenticated;
grant update (status, dibatalkan_at)  on table public.transaksi to authenticated;
grant select, insert on table public.transaksi_item          to authenticated;
grant select, insert on table public.transaksi_item_modifier to authenticated;
