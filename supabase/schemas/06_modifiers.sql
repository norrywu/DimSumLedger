

create table public.modifiers (
  id         uuid        primary key default gen_random_uuid(),
  nama       text        not null,
 price      numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create unique index modifiers_nama_uniq on public.modifiers (lower(nama));

-- --- Keamanan -----------------------------------------------
alter table public.modifiers enable row level security;

create policy "pengelola_akses_penuh" on public.modifiers
  for all to authenticated
  using (internal.is_pengelola())
  with check (internal.is_pengelola());

grant select, insert, update, delete on table public.modifiers to authenticated;
