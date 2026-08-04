

create table public.modifiers (
  id             uuid          primary key default gen_random_uuid(),
  nama           text          not null,

  tambahan_harga numeric(12,2) not null default 0 check (tambahan_harga >= 0),

  tambahan_modal numeric(12,2) not null default 0 check (tambahan_modal >= 0),
   created_at     timestamptz   not null default now(),

  constraint modifiers_nama_check
    check (nama = btrim(nama) and length(nama) between 1 and 50)
);

create unique index modifiers_nama_uniq on public.modifiers (lower(nama));

alter table public.modifiers enable row level security;

create policy "pengelola_akses_penuh" on public.modifiers
  for all to authenticated
  using (internal.is_pengelola())
  with check (internal.is_pengelola());

revoke all on table public.modifiers from anon, authenticated;
grant select, insert, update, delete on table public.modifiers to authenticated;
