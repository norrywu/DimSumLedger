

create table public.variant_packagings (
  variant_id   uuid     not null references public.variants (id)   on delete cascade,
  packaging_id uuid     not null references public.packagings (id) on delete restrict,
  jumlah       smallint not null default 1 check (jumlah > 0),

  primary key (variant_id, packaging_id)
);

-- Untuk pertanyaan sebaliknya: "kemasan ini dipakai varian mana saja?"
create index variant_packagings_packaging_idx on public.variant_packagings (packaging_id);

-- --- Keamanan -----------------------------------------------
alter table public.variant_packagings enable row level security;

create policy "pengelola_akses_penuh" on public.variant_packagings
  for all to authenticated
  using (internal.is_pengelola())
  with check (internal.is_pengelola());

grant select, insert, update, delete on table public.variant_packagings to authenticated;
