create or replace function public.setor_omzet_harian(p_tanggal date)
returns numeric
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_omzet numeric(12,2);
  v_awal  timestamptz;
  v_akhir timestamptz;
begin
  -- TimeZone database UTC, "hari" toko adalah WIB.
  v_awal  := p_tanggal::timestamp       at time zone 'Asia/Jakarta';
  v_akhir := (p_tanggal + 1)::timestamp at time zone 'Asia/Jakarta';

  select coalesce(sum(t.total), 0) into v_omzet
    from public.transaksi t
   where t.status = 'selesai'
     and t.created_at >= v_awal
     and t.created_at <  v_akhir;

  if v_omzet <= 0 then
    raise exception 'Belum ada penjualan pada % yang bisa disetor.', p_tanggal;
  end if;

  insert into public.cash_flow
    (type, amount, category, description, source, transaction_date)
  values
    ('income', v_omzet, 'Penjualan', 'Setoran omzet POS', 'pos', p_tanggal)
  on conflict (transaction_date) where source = 'pos'
  do update set amount = excluded.amount;

  return v_omzet;
end;
$$;

-- --- Keamanan -----------------------------------------------
revoke execute on function public.setor_omzet_harian(date) from public, anon;
grant execute on function public.setor_omzet_harian(date) to authenticated;
