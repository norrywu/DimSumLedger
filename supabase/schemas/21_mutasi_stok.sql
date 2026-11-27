-- RPC atomik untuk mencatat, mengubah, dan menghapus riwayat stok manual.
-- Semua fungsi mengunci baris produk terkait dengan `FOR UPDATE` sebelum
-- mengubah `products.stok_pcs` agar tidak terjadi race condition dengan kasir
-- maupun antar-pengelola, sekaligus menjamin stok tidak pernah minus.

create or replace function public.catat_stok(
  p_product_id uuid,
  p_jenis      text,
  p_jumlah_pcs integer,
  p_catatan    text,
  p_tanggal    date
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id          uuid;
  v_pelaku_id   uuid := (select auth.uid());
  v_pelaku_nama text;
  v_catatan     text := nullif(btrim(coalesce(p_catatan, '')), '');
  v_produk      record;
  v_stok_baru   bigint;
begin
  if not internal.is_pengelola() then
    raise exception 'Kamu tidak punya akses mengelola stok.';
  end if;

  if v_pelaku_id is null then
    raise exception 'Kamu harus login untuk mengelola stok.';
  end if;

  select btrim(p.name) into v_pelaku_nama
    from public.profiles p
   where p.id = v_pelaku_id;

  if v_pelaku_nama is null or v_pelaku_nama = '' then
    raise exception 'Profil kamu tidak ditemukan. Coba login ulang.';
  end if;

  if p_jenis is null or p_jenis not in ('masuk', 'keluar') then
    raise exception 'Jenis mutasi stok tidak dikenali.';
  end if;

  if p_jumlah_pcs is null or p_jumlah_pcs < 1 then
    raise exception 'Jumlah stok harus lebih dari 0 pcs.';
  end if;

  if p_tanggal is null then
    raise exception 'Tanggal mutasi stok wajib diisi.';
  end if;

  if v_catatan is not null and length(v_catatan) > 200 then
    raise exception 'Catatan maksimal 200 karakter.';
  end if;

  if p_jenis = 'keluar' and v_catatan is null then
    raise exception 'Catatan wajib diisi saat mengurangi stok.';
  end if;

  select id, nama, lacak_stok, stok_pcs
    into v_produk
    from public.products
   where id = p_product_id
     for update;

  if not found then
    raise exception 'Produk tidak ditemukan. Muat ulang halaman.';
  end if;

  if not v_produk.lacak_stok then
    raise exception 'Pelacakan stok untuk produk "%" belum diaktifkan.', v_produk.nama;
  end if;

  v_stok_baru := v_produk.stok_pcs::bigint + (
    case
      when p_jenis = 'masuk' then p_jumlah_pcs::bigint
      else -p_jumlah_pcs::bigint
    end
  );

  if v_stok_baru < 0 then
    raise exception 'Stok "%" tidak cukup. Sisa % pcs, tidak bisa dikurangi % pcs.',
      v_produk.nama, v_produk.stok_pcs, p_jumlah_pcs;
  end if;

  if v_stok_baru > 2147483647 then
    raise exception 'Jumlah stok "%" melebihi batas maksimum.', v_produk.nama;
  end if;

  update public.products
     set stok_pcs = v_stok_baru::integer
   where id = v_produk.id;

  insert into public.riwayat_stok
    (product_id, nama_produk, jenis, jumlah_pcs, catatan, tanggal, pelaku_id, pelaku_nama)
  values
    (v_produk.id, v_produk.nama, p_jenis, p_jumlah_pcs, v_catatan, p_tanggal, v_pelaku_id, v_pelaku_nama)
  returning id into v_id;

  return v_id;
end;
$$;

revoke execute on function public.catat_stok(uuid, text, integer, text, date)
  from public, anon;
grant execute on function public.catat_stok(uuid, text, integer, text, date)
  to authenticated;

create or replace function public.ubah_riwayat_stok(
  p_id         uuid,
  p_jenis      text,
  p_jumlah_pcs integer,
  p_catatan    text,
  p_tanggal    date
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_catatan   text := nullif(btrim(coalesce(p_catatan, '')), '');
  v_lama      record;
  v_produk    record;
  v_efek_lama bigint;
  v_efek_baru bigint;
  v_selisih   bigint;
  v_stok_baru bigint;
begin
  if not internal.is_pengelola() then
    raise exception 'Kamu tidak punya akses mengelola stok.';
  end if;

  if p_jenis is null or p_jenis not in ('masuk', 'keluar') then
    raise exception 'Jenis mutasi stok tidak dikenali.';
  end if;

  if p_jumlah_pcs is null or p_jumlah_pcs < 1 then
    raise exception 'Jumlah stok harus lebih dari 0 pcs.';
  end if;

  if p_tanggal is null then
    raise exception 'Tanggal mutasi stok wajib diisi.';
  end if;

  if v_catatan is not null and length(v_catatan) > 200 then
    raise exception 'Catatan maksimal 200 karakter.';
  end if;

  if p_jenis = 'keluar' and v_catatan is null then
    raise exception 'Catatan wajib diisi saat mengurangi stok.';
  end if;

  select id, product_id, nama_produk, jenis, jumlah_pcs
    into v_lama
    from public.riwayat_stok
   where id = p_id
     for update;

  if not found then
    raise exception 'Catatan riwayat stok tidak ditemukan. Muat ulang halaman.';
  end if;

  if v_lama.product_id is null then
    raise exception 'Catatan milik produk "%" yang sudah dihapus tidak bisa diubah.',
      v_lama.nama_produk;
  end if;

  select id, nama, lacak_stok, stok_pcs
    into v_produk
    from public.products
   where id = v_lama.product_id
     for update;

  if not found then
    raise exception 'Produk "%" sudah dihapus sehingga catatan ini tidak bisa diubah.',
      v_lama.nama_produk;
  end if;

  if not v_produk.lacak_stok then
    raise exception 'Pelacakan stok produk "%" sedang nonaktif. Aktifkan kembali terlebih dahulu untuk mengubah catatan ini.',
      v_produk.nama;
  end if;

  v_efek_lama := case
    when v_lama.jenis = 'masuk' then v_lama.jumlah_pcs::bigint
    else -v_lama.jumlah_pcs::bigint
  end;
  v_efek_baru := case
    when p_jenis = 'masuk' then p_jumlah_pcs::bigint
    else -p_jumlah_pcs::bigint
  end;
  v_selisih   := v_efek_baru - v_efek_lama;
  v_stok_baru := v_produk.stok_pcs::bigint + v_selisih;

  if v_stok_baru < 0 then
    raise exception 'Perubahan ditolak karena stok "%" akan menjadi minus (sisa saat ini % pcs).',
      v_produk.nama, v_produk.stok_pcs;
  end if;

  if v_stok_baru > 2147483647 then
    raise exception 'Jumlah stok "%" melebihi batas maksimum.', v_produk.nama;
  end if;

  if v_selisih <> 0 then
    update public.products
       set stok_pcs = v_stok_baru::integer
     where id = v_produk.id;
  end if;

  update public.riwayat_stok
     set nama_produk = v_produk.nama,
         jenis       = p_jenis,
         jumlah_pcs  = p_jumlah_pcs,
         catatan     = v_catatan,
         tanggal     = p_tanggal
   where id = v_lama.id;
end;
$$;

revoke execute on function public.ubah_riwayat_stok(uuid, text, integer, text, date)
  from public, anon;
grant execute on function public.ubah_riwayat_stok(uuid, text, integer, text, date)
  to authenticated;

create or replace function public.hapus_riwayat_stok(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_lama      record;
  v_produk    record;
  v_balik     bigint;
  v_stok_baru bigint;
begin
  if not internal.is_pengelola() then
    raise exception 'Kamu tidak punya akses mengelola stok.';
  end if;

  select id, product_id, nama_produk, jenis, jumlah_pcs
    into v_lama
    from public.riwayat_stok
   where id = p_id
     for update;

  if not found then
    raise exception 'Catatan riwayat stok tidak ditemukan. Muat ulang halaman.';
  end if;

  if v_lama.product_id is not null then
    select id, nama, stok_pcs
      into v_produk
      from public.products
     where id = v_lama.product_id
       for update;

    if found then
      v_balik := case
        when v_lama.jenis = 'masuk' then -v_lama.jumlah_pcs::bigint
        else v_lama.jumlah_pcs::bigint
      end;
      v_stok_baru := v_produk.stok_pcs::bigint + v_balik;

      if v_stok_baru < 0 then
        raise exception 'Catatan tidak bisa dihapus karena stok "%" saat ini hanya tersisa % pcs.',
          v_produk.nama, v_produk.stok_pcs;
      end if;

      if v_stok_baru > 2147483647 then
        raise exception 'Jumlah stok "%" melebihi batas maksimum.', v_produk.nama;
      end if;

      update public.products
         set stok_pcs = v_stok_baru::integer
       where id = v_produk.id;
    end if;
  end if;

  delete from public.riwayat_stok
   where id = v_lama.id;
end;
$$;

revoke execute on function public.hapus_riwayat_stok(uuid)
  from public, anon;
grant execute on function public.hapus_riwayat_stok(uuid)
  to authenticated;
