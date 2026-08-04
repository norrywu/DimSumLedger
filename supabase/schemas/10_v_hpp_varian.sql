
create view public.v_hpp_varian
with (security_invoker = true) as
  select v.id,
         v.product_id,
         v.nama,
         v.jumlah_pcs,
         v.harga_jual,
         v.modal_bahan,
         v.aktif,
         p.nama as produk_nama,
         coalesce(k.modal_kemasan, 0) as modal_kemasan,
         -- `jumlah_pcs` boleh null (varian yang belum diisi isinya). Null di
         -- sini berarti upahnya nol, bukan seluruh modal ikut jadi null.
         coalesce(v.jumlah_pcs, 0) * p.upah_per_pcs as modal_upah,
         v.modal_bahan + coalesce(k.modal_kemasan, 0)
           + coalesce(v.jumlah_pcs, 0) * p.upah_per_pcs as modal_total,
         v.harga_jual - v.modal_bahan - coalesce(k.modal_kemasan, 0)
           - coalesce(v.jumlah_pcs, 0) * p.upah_per_pcs as margin,
         coalesce(k.kemasan, '[]'::jsonb) as kemasan
    from public.variants v
    join public.products p on p.id = v.product_id
   
    left join lateral (
      select sum(pk.harga_satuan * vp.jumlah) as modal_kemasan,
             jsonb_agg(
               jsonb_build_object('packaging_id', vp.packaging_id,
                                  'jumlah',       vp.jumlah)
               order by pk.nama
             ) as kemasan
        from public.variant_packagings vp
        join public.packagings pk on pk.id = vp.packaging_id
       where vp.variant_id = v.id
    ) k on true;


revoke all on public.v_hpp_varian from anon, authenticated, public;
grant select on public.v_hpp_varian to authenticated;
