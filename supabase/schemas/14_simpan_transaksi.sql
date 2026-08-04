drop function if exists public.simpan_transaksi(jsonb, jsonb);

create or replace function public.simpan_transaksi(p_items jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_transaksi_id uuid;
  v_kasir_id     uuid := (select auth.uid());
  v_kasir_nama   text;
  v_total        numeric(12,2) := 0;
  v_baris        jsonb;
  v_qty          integer;
  v_varian       record;
  v_item_id      uuid;
  v_tambahan     numeric(12,2);
  v_diminta      integer;
begin
  if v_kasir_id is null then
    raise exception 'Kamu harus login untuk mencatat transaksi.';
  end if;

  select p.name into v_kasir_nama
    from public.profiles p
   where p.id = v_kasir_id;

  if v_kasir_nama is null then
    raise exception 'Profil kamu tidak ditemukan. Coba login ulang.';
  end if;

  if p_items is null or jsonb_array_length(p_items) < 1 then
    raise exception 'Keranjang masih kosong.';
  end if;

  insert into public.transaksi (kasir_id, kasir_nama, total)
  values (v_kasir_id, v_kasir_nama, 0)
  returning id into v_transaksi_id;

  for v_baris in select * from jsonb_array_elements(p_items)
  loop
    v_qty := coalesce((v_baris->>'qty')::integer, 0);

    if v_qty < 1 or v_qty > 32767 then
      raise exception 'Jumlah porsi tidak masuk akal.';
    end if;

    select h.nama, h.produk_nama, h.jumlah_pcs,
           h.harga_jual, h.modal_bahan, h.modal_kemasan, h.aktif
      into v_varian
      from public.v_hpp_varian h
     where h.id = (v_baris->>'variant_id')::uuid;

    if not found then
      raise exception 'Ada varian yang sudah tidak ada. Muat ulang halaman.';
    end if;

    if not v_varian.aktif then
      raise exception 'Varian "%" sudah tidak dijual.', v_varian.nama;
    end if;

    insert into public.transaksi_item
      (transaksi_id, variant_id, nama_produk, nama_varian, jumlah_pcs,
       harga_satuan, modal_bahan_satuan, modal_kemasan_satuan, qty)
    values
      (v_transaksi_id, (v_baris->>'variant_id')::uuid, v_varian.produk_nama,
       v_varian.nama, v_varian.jumlah_pcs, v_varian.harga_jual,
       v_varian.modal_bahan, v_varian.modal_kemasan, v_qty)
    returning id into v_item_id;

    insert into public.transaksi_item_modifier
      (transaksi_item_id, modifier_id, nama, tambahan_harga, tambahan_modal)
    select v_item_id, m.id, m.nama, m.tambahan_harga, m.tambahan_modal
      from public.modifiers m
     where m.id in (
       select e::uuid
         from jsonb_array_elements_text(
                coalesce(v_baris->'extra', '[]'::jsonb)
              ) e
     );

    v_diminta := jsonb_array_length(coalesce(v_baris->'extra', '[]'::jsonb));

    if (select count(*) from public.transaksi_item_modifier tim
         where tim.transaksi_item_id = v_item_id) <> v_diminta then
      raise exception 'Ada extra yang sudah tidak ada. Muat ulang halaman.';
    end if;

    select coalesce(sum(tim.tambahan_harga), 0) into v_tambahan
      from public.transaksi_item_modifier tim
     where tim.transaksi_item_id = v_item_id;

    v_total := v_total + (v_varian.harga_jual + v_tambahan) * v_qty;
  end loop;

  update public.transaksi
     set total = v_total
   where id = v_transaksi_id;

  return v_transaksi_id;
end;
$$;

revoke execute on function public.simpan_transaksi(jsonb) from public, anon;
grant execute on function public.simpan_transaksi(jsonb) to authenticated;
