create view public.katalog_extra
with (security_invoker = false) as
  select m.id,
         m.nama,
         m.tambahan_harga
    from public.modifiers m;

revoke all on public.katalog_extra from anon, authenticated, public;
grant select on public.katalog_extra to authenticated;
