
create view public.katalog_jual
with (security_invoker = false) as
  select v.id,
         v.nama        as varian_nama,
         v.jumlah_pcs,
         v.harga_jual,
         p.id          as product_id,
         p.nama        as produk_nama,
         k.id          as category_id,
         k.nama        as kategori_nama
    from public.variants v
    join public.products p   on p.id = v.product_id
    join public.categories k on k.id = p.category_id
   where v.aktif;

revoke all on public.katalog_jual from anon, public;
grant select on public.katalog_jual to authenticated;
