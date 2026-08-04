

create table public.products (
  id          uuid        primary key default gen_random_uuid(),
  category_id uuid        not null references public.categories (id) on delete restrict,
  nama        text        not null,

  -- Upah/reward per POTONG, bukan per porsi: yang dibayar adalah kerja membuat
  -- tiap butir, jadi "isi 8" otomatis dua kali "isi 4" tanpa diisi ulang.
  -- Diletakkan di produk, bukan varian, karena varian dari produk yang sama
  -- adalah dimsum yang sama — hanya beda banyak isinya.
  upah_per_pcs numeric(12,2) not null default 0 check (upah_per_pcs >= 0),

  created_at  timestamptz not null default now(),

  constraint products_nama_check
    check (nama = btrim(nama) and length(nama) between 1 and 50)
);


create unique index products_nama_uniq on public.products (lower(nama));

create index products_category_idx on public.products (category_id, nama);

-- --- Keamanan -----------------------------------------------
alter table public.products enable row level security;

create policy "pengelola_akses_penuh" on public.products
  for all to authenticated
  using (internal.is_pengelola())
  with check (internal.is_pengelola());

revoke all on table public.products from anon, authenticated;
grant select, insert, update, delete on table public.products to authenticated;
