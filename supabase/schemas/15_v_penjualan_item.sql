-- Satu baris per item terjual, dengan extra sudah ikut dihitung dan dikali qty.
--
-- `transaksi_item_modifier` menyimpan harga PER PORSI dan tidak punya kolom qty
-- (qty-nya ada di induknya), jadi `sum(tambahan_harga)` langsung ke tabel itu
-- selalu kurang hitung. Begitu juga `hpp_satuan` yang belum termasuk
-- `tambahan_modal`. View ini menutup dua jebakan itu supaya laporan tidak perlu
-- mengingat join-nya sendiri.
--
-- `status` sengaja diteruskan apa adanya, bukan difilter di sini — pemanggil yang
-- memutuskan (laporan omzet menyaring 'selesai', audit pembatalan justru tidak).

create view public.v_penjualan_item
with (security_invoker = true) as
  select ti.id,
         ti.transaksi_id,
         t.created_at,
         t.status,
         t.kasir_id,
         t.kasir_nama,
         ti.variant_id,
         ti.nama_produk,
         ti.nama_varian,
         ti.jumlah_pcs,
         ti.qty,
         ti.harga_satuan,
         ti.modal_bahan_satuan,
         ti.modal_kemasan_satuan,
         ti.modal_upah_satuan,
         ti.hpp_satuan,
         coalesce(x.extra_harga, 0) as extra_harga_satuan,
         coalesce(x.extra_modal, 0) as extra_modal_satuan,
         coalesce(x.daftar, '-')    as daftar_extra,
         coalesce(x.jumlah, 0) > 0  as pakai_extra,

         ti.modal_bahan_satuan      * ti.qty as modal_bahan,
         ti.modal_kemasan_satuan    * ti.qty as modal_kemasan,
         ti.modal_upah_satuan       * ti.qty as modal_upah,
         coalesce(x.extra_modal, 0) * ti.qty as modal_extra,
         coalesce(ti.jumlah_pcs, 0) * ti.qty as pcs,

         (ti.harga_satuan + coalesce(x.extra_harga, 0)) * ti.qty as omzet,
         (ti.hpp_satuan   + coalesce(x.extra_modal, 0)) * ti.qty as modal,
         (ti.harga_satuan + coalesce(x.extra_harga, 0)
        - ti.hpp_satuan   - coalesce(x.extra_modal, 0)) * ti.qty as laba

    from public.transaksi_item ti
    join public.transaksi t on t.id = ti.transaksi_id

    left join lateral (
      select sum(tim.tambahan_harga) as extra_harga,
             sum(tim.tambahan_modal) as extra_modal,
             count(*)                as jumlah,
             string_agg(tim.nama, ', ' order by tim.nama) as daftar
        from public.transaksi_item_modifier tim
       where tim.transaksi_item_id = ti.id
    ) x on true;

-- --- Keamanan -----------------------------------------------
-- `security_invoker` di atas membuat RLS `transaksi`/`transaksi_item` tetap
-- berlaku: kasir hanya melihat barisnya sendiri, pengelola semuanya.
revoke all on public.v_penjualan_item from anon, authenticated, public;
grant select on public.v_penjualan_item to authenticated;
