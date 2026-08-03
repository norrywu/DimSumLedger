

create table public.categories (
  id         uuid        primary key default gen_random_uuid(),
  nama       text        not null,
  created_at timestamptz not null default now(),

  -- `nama = btrim(nama)` bukan sekadar kerapian: tanpa itu ' Minuman ' dan
  -- 'Minuman' tersimpan sebagai dua baris berbeda, dan `categories_nama_uniq`
  -- yang memakai lower(nama) bisa dikelabui spasi di ujung. Batas 50
  -- menyamakan dengan `categorySchema`.
  constraint categories_nama_check
    check (nama = btrim(nama) and length(nama) between 1 and 50)
);
create unique index categories_nama_uniq on public.categories (lower(nama));

-- --- Keamanan -----------------------------------------------
alter table public.categories enable row level security;

create policy "pengelola_akses_penuh" on public.categories
  for all to authenticated
  using (internal.is_pengelola())
  with check (internal.is_pengelola());

-- Tanpa GRANT, tabel tidak bisa disentuh lewat Data API sama sekali.
grant select, insert, update, delete on table public.categories to authenticated;
