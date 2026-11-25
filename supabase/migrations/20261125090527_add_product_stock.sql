-- Tambah dukungan pelacakan stok berbasis pcs di tabel public.products.

alter table public.products
  add column if not exists lacak_stok boolean not null default false,
  add column if not exists stok_pcs integer not null default 0;

do $$
begin
  if not exists (
    select 1
      from pg_constraint
     where conname = 'products_stok_pcs_check'
       and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
      add constraint products_stok_pcs_check check (stok_pcs >= 0);
  end if;
end $$;

-- Validasi agar produk dengan varian aktif tanpa jumlah_pcs tidak bisa
-- menyalakan pelacakan stok.
create or replace function internal.cek_varian_sebelum_lacak_stok()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (
    select 1
      from public.variants v
     where v.product_id = new.id
       and v.aktif
       and v.jumlah_pcs is null
  ) then
    raise exception 'Isi dulu jumlah pcs pada semua varian aktif produk "%" sebelum mengaktifkan pelacakan stok.',
      new.nama;
  end if;

  return new;
end;
$$;

revoke execute on function internal.cek_varian_sebelum_lacak_stok()
  from public, anon, authenticated;

drop trigger if exists before_products_lacak_stok on public.products;
create trigger before_products_lacak_stok
  before insert or update of lacak_stok on public.products
  for each row
  when (new.lacak_stok)
  execute function internal.cek_varian_sebelum_lacak_stok();

-- Validasi agar varian aktif tanpa jumlah_pcs tidak bisa disimpan bila
-- produknya melacak stok.
create or replace function internal.cek_pcs_varian_lacak_stok()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (
    select 1
      from public.products p
     where p.id = new.product_id
       and p.lacak_stok
  ) then
    raise exception 'Jumlah pcs wajib diisi karena produk ini melacak stok.';
  end if;

  return new;
end;
$$;

revoke execute on function internal.cek_pcs_varian_lacak_stok()
  from public, anon, authenticated;

drop trigger if exists before_variants_cek_pcs_stok on public.variants;
create trigger before_variants_cek_pcs_stok
  before insert or update of product_id, jumlah_pcs, aktif on public.variants
  for each row
  when (new.aktif and new.jumlah_pcs is null)
  execute function internal.cek_pcs_varian_lacak_stok();

CREATE OR REPLACE FUNCTION public.simpan_varian(
  p_id          uuid,
  p_product_id  uuid,
  p_nama        text,
  p_jumlah_pcs  smallint,
  p_harga_jual  numeric,
  p_modal_bahan numeric,
  p_aktif       boolean,
  p_kemasan     jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF p_kemasan IS NULL OR jsonb_array_length(p_kemasan) < 1 THEN
    RAISE EXCEPTION 'Varian wajib punya minimal satu kemasan.';
  END IF;

  IF (SELECT count(*) FROM jsonb_array_elements(p_kemasan)) <> (
       SELECT count(DISTINCT baris->>'packaging_id')
         FROM jsonb_array_elements(p_kemasan) baris
     ) THEN
    RAISE EXCEPTION 'Kemasan tidak boleh kembar dalam satu varian.';
  END IF;

  IF p_aktif AND p_jumlah_pcs IS NULL AND EXISTS (
    SELECT 1
      FROM public.products p
     WHERE p.id = p_product_id
       AND p.lacak_stok
  ) THEN
    RAISE EXCEPTION 'Jumlah pcs wajib diisi karena produk ini melacak stok.';
  END IF;

  IF p_id IS NULL THEN
    INSERT INTO public.variants
      (product_id, nama, jumlah_pcs, harga_jual, modal_bahan, aktif)
      VALUES
      (p_product_id, btrim(p_nama), p_jumlah_pcs, p_harga_jual, p_modal_bahan, p_aktif)
    RETURNING id INTO v_id;
  ELSE
    UPDATE public.variants
       SET product_id  = p_product_id,
           nama        = btrim(p_nama),
           jumlah_pcs  = p_jumlah_pcs,
           harga_jual  = p_harga_jual,
           modal_bahan = p_modal_bahan,
           aktif       = p_aktif
     WHERE id = p_id
    RETURNING id INTO v_id;

    IF v_id IS NULL THEN
      RAISE EXCEPTION 'Varian sudah tidak ada. Muat ulang halaman.';
    END IF;
  END IF;

  DELETE FROM public.variant_packagings vp
   WHERE vp.variant_id = v_id
     AND NOT EXISTS (
       SELECT 1
         FROM jsonb_array_elements(p_kemasan) baris
        WHERE (baris->>'packaging_id')::uuid = vp.packaging_id
     );

  INSERT INTO public.variant_packagings (variant_id, packaging_id, jumlah)
  SELECT v_id,
         (baris->>'packaging_id')::uuid,
         (baris->>'jumlah')::smallint
    FROM jsonb_array_elements(p_kemasan) baris
      ON CONFLICT (variant_id, packaging_id)
      DO UPDATE SET jumlah = excluded.jumlah;

  RETURN v_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.simpan_varian(
  uuid, uuid, text, smallint, numeric, numeric, boolean, jsonb
) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.simpan_varian(
  uuid, uuid, text, smallint, numeric, numeric, boolean, jsonb
) TO authenticated;

create or replace view public.katalog_jual
with (security_invoker = false) as
  select v.id,
         v.nama        as varian_nama,
         v.jumlah_pcs,
         v.harga_jual,
         p.id          as product_id,
         p.nama        as produk_nama,
         k.id          as category_id,
         k.nama        as kategori_nama,
         p.lacak_stok,
         p.stok_pcs
    from public.variants v
    join public.products p   on p.id = v.product_id
    join public.categories k on k.id = p.category_id
   where v.aktif;

revoke all on public.katalog_jual from anon, authenticated, public;
grant select on public.katalog_jual to authenticated;

create or replace function public.simpan_transaksi(p_items jsonb, p_dibayar numeric)
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
  v_stok         record;
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
           h.harga_jual, h.modal_bahan, h.modal_kemasan, h.modal_upah, h.aktif
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
       harga_satuan, modal_bahan_satuan, modal_kemasan_satuan,
       modal_upah_satuan, qty)
    values
      (v_transaksi_id, (v_baris->>'variant_id')::uuid, v_varian.produk_nama,
       v_varian.nama, v_varian.jumlah_pcs, v_varian.harga_jual,
       v_varian.modal_bahan, v_varian.modal_kemasan, v_varian.modal_upah,
       v_qty)
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

  if p_dibayar is null or p_dibayar < v_total then
    raise exception 'Uang yang dibayarkan kurang. Total %, dibayar %.',
      v_total, coalesce(p_dibayar, 0);
  end if;

  for v_stok in
    with kebutuhan as (
      select v.product_id,
             sum(ti.qty * coalesce(ti.jumlah_pcs, 0))::integer as diminta_pcs,
             bool_or(ti.jumlah_pcs is null)                    as ada_tanpa_pcs
        from public.transaksi_item ti
        join public.variants v on v.id = ti.variant_id
       where ti.transaksi_id = v_transaksi_id
       group by v.product_id
    )
    select p.id,
           p.nama,
           p.stok_pcs,
           k.diminta_pcs,
           k.ada_tanpa_pcs
      from public.products p
      join kebutuhan k on k.product_id = p.id
     where p.lacak_stok
     order by p.id
       for update of p
  loop
    if v_stok.ada_tanpa_pcs then
      raise exception 'Varian produk "%" belum punya jumlah pcs, sehingga stok tidak bisa dihitung.',
        v_stok.nama;
    end if;

    if v_stok.stok_pcs < v_stok.diminta_pcs then
      raise exception 'Stok "%" tidak cukup. Sisa % pcs, dibutuhkan % pcs.',
        v_stok.nama, v_stok.stok_pcs, v_stok.diminta_pcs;
    end if;

    update public.products
       set stok_pcs = stok_pcs - v_stok.diminta_pcs
     where id = v_stok.id;
  end loop;

  update public.transaksi
     set total = v_total, dibayar = p_dibayar
   where id = v_transaksi_id;

  return v_transaksi_id;
end;
$$;

revoke execute on function public.simpan_transaksi(jsonb, numeric) from public, anon;
grant execute on function public.simpan_transaksi(jsonb, numeric) to authenticated;

create or replace function internal.kembalikan_stok_saat_batal()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  with pengembalian as (
    select v.product_id,
           sum(ti.qty * ti.jumlah_pcs)::integer as kembali_pcs
      from public.transaksi_item ti
      join public.variants v on v.id = ti.variant_id
     where ti.transaksi_id = new.id
       and ti.jumlah_pcs is not null
     group by v.product_id
  )
  update public.products p
     set stok_pcs = p.stok_pcs + r.kembali_pcs
    from pengembalian r
   where p.id = r.product_id
     and p.lacak_stok;

  return new;
end;
$$;

revoke execute on function internal.kembalikan_stok_saat_batal()
  from public, anon, authenticated;

drop trigger if exists on_transaksi_dibatalkan on public.transaksi;
create trigger on_transaksi_dibatalkan
  after update of status on public.transaksi
  for each row
  when (old.status = 'selesai' and new.status = 'dibatalkan')
  execute function internal.kembalikan_stok_saat_batal();
