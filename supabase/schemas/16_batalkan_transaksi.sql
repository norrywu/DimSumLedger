-- Membatalkan satu transaksi.
--
-- SECURITY INVOKER, kebalikan dari `simpan_transaksi` — di sini justru RLS yang
-- jadi aturannya: policy `kasir_batalkan_transaksi_baru` yang memutuskan siapa
-- boleh membatalkan apa, dan `pengelola_akses_penuh` yang membebaskan pengelola.
-- Fungsi ini tidak menambah wewenang apa pun, hanya membungkusnya.
--
-- Dibungkus RPC dan bukan update langsung dari client karena dua alasan:
-- `dibatalkan_at` harus memakai jam SERVER (client bisa mengirim jam apa saja),
-- dan update yang ditolak RLS mengembalikan "0 baris" tanpa penjelasan — kasir
-- perlu tahu apakah notanya sudah dibatalkan atau jendelanya sudah lewat.
create or replace function public.batalkan_transaksi(p_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_status text;
begin
  -- Policy SELECT kasir tidak dibatasi waktu, jadi baris yang tidak terbaca
  -- di sini benar-benar bukan miliknya — bukan sekadar kedaluwarsa.
  select status into v_status
    from public.transaksi
   where id = p_id;

  if not found then
    raise exception 'Transaksi tidak ditemukan.';
  end if;

  if v_status = 'dibatalkan' then
    raise exception 'Transaksi ini sudah dibatalkan.';
  end if;

  update public.transaksi
     set status = 'dibatalkan', dibatalkan_at = now()
   where id = p_id;

  -- Terbaca tapi tidak terupdate berarti policy UPDATE yang menolak, dan
  -- satu-satunya syarat yang bisa gagal di titik ini adalah umur notanya.
  if not found then
    raise exception 'Batas waktu pembatalan sudah lewat. Minta pengelola untuk membatalkannya.';
  end if;
end;
$$;

-- --- Keamanan -----------------------------------------------
revoke execute on function public.batalkan_transaksi(uuid) from public, anon;
grant execute on function public.batalkan_transaksi(uuid) to authenticated;

-- Mengembalikan stok saat transaksi dibatalkan (oleh kasir maupun pengelola).
-- Dipasang sebagai trigger AFTER UPDATE OF status ber-SECURITY DEFINER supaya
-- `public.batalkan_transaksi` tetap SECURITY INVOKER dan aturan RLS 10 menit
-- untuk kasir tidak terganggu, sementara kasir tetap tidak perlu izin UPDATE
-- langsung ke tabel `public.products`.
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
