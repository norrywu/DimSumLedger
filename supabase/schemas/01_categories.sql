

create table public.categories (
  id         uuid        primary key default gen_random_uuid(),
  nama       text        not null,
  created_at timestamptz not null default now()
);

-- Nama kategori unik tanpa peduli besar-kecil huruf ("Minuman" = "minuman").
-- Sekaligus melayani pengurutan per nama, jadi tidak perlu index terpisah.
create unique index categories_nama_uniq on public.categories (lower(nama));

-- --- Keamanan -----------------------------------------------
alter table public.categories enable row level security;

create policy "pengelola_akses_penuh" on public.categories
  for all to authenticated
  using (internal.is_pengelola())
  with check (internal.is_pengelola());

-- Tanpa GRANT, tabel tidak bisa disentuh lewat Data API sama sekali.
grant select, insert, update, delete on table public.categories to authenticated;
