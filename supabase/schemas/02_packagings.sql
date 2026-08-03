

create table public.packagings (
  id           uuid          primary key default gen_random_uuid(),
  nama         text          not null,
  harga_satuan numeric(12,2) not null default 0 check (harga_satuan >= 0),
  created_at   timestamptz   not null default now(),

  constraint packagings_nama_check
    check (nama = btrim(nama) and length(nama) between 1 and 50)
);


create unique index packagings_nama_uniq on public.packagings (lower(nama));

-- --- Keamanan -----------------------------------------------
alter table public.packagings enable row level security;

create policy "pengelola_akses_penuh" on public.packagings
  for all to authenticated
  using (internal.is_pengelola())
  with check (internal.is_pengelola());

grant select, insert, update, delete on table public.packagings to authenticated;
