

create table public.variants (
  id          uuid          primary key default gen_random_uuid(),
  product_id  uuid          not null references public.products (id) on delete cascade,
  nama        text          not null,
  -- NULL = jumlah pcs belum diketahui.
  jumlah_pcs  smallint      check (jumlah_pcs > 0),
  harga_jual  numeric(12,2) not null default 0 check (harga_jual >= 0),
  -- Modal isi/adonan saja. Modal kemasan dihitung dari variant_packagings.
  modal_bahan numeric(12,2) not null default 0 check (modal_bahan >= 0),
  aktif       boolean       not null default true,
  created_at  timestamptz   not null default now(),

  unique (product_id, nama)
);

create index variants_product_idx on public.variants (product_id, nama);

-- --- Keamanan -----------------------------------------------
alter table public.variants enable row level security;

create policy "pengelola_akses_penuh" on public.variants
  for all to authenticated
  using (internal.is_pengelola())
  with check (internal.is_pengelola());

grant select, insert, update, delete on table public.variants to authenticated;
