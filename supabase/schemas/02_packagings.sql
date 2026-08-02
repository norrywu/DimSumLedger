

create table public.packagings (
  id           uuid          primary key default gen_random_uuid(),
  nama         text          not null,
  harga_satuan numeric(12,2) not null default 0 check (harga_satuan >= 0),
  aktif        boolean       not null default true,
  created_at   timestamptz   not null default now()
);

create unique index packagings_nama_uniq on public.packagings (lower(nama));

-- --- Keamanan -----------------------------------------------
alter table public.packagings enable row level security;

create policy "pengelola_akses_penuh" on public.packagings
  for all to authenticated
  using (internal.is_pengelola())
  with check (internal.is_pengelola());

grant select, insert, update, delete on table public.packagings to authenticated;
