create table public.cash_flow (
  id          uuid          primary key default gen_random_uuid(),
  type        text          not null check (type in ('income', 'expense')),
  amount      numeric(12,2) not null check (amount > 0),
  category    text          not null,
  description text,

  source      text          not null default 'manual'
    check (source in ('manual', 'pos')),

  transaction_date date        not null default current_date,
  created_at       timestamptz not null default now(),

  constraint cash_flow_category_check
    check (category = btrim(category) and length(category) between 1 and 50),
  constraint cash_flow_description_check
    check (description is null or btrim(description) <> '')
);

create index cash_flow_tanggal_idx on public.cash_flow (transaction_date desc);

create unique index cash_flow_pos_harian_uniq
  on public.cash_flow (transaction_date)
  where source = 'pos';

-- --- Keamanan -----------------------------------------------
alter table public.cash_flow enable row level security;

create policy "pengelola_akses_penuh" on public.cash_flow
  for all to authenticated
  using (internal.is_pengelola())
  with check (internal.is_pengelola());

revoke all on table public.cash_flow from anon, authenticated;
grant select, insert, update, delete on table public.cash_flow to authenticated;
