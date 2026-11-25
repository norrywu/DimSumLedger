
create table public.variants (
  id          uuid          primary key default gen_random_uuid(),

  product_id  uuid          not null references public.products (id) on delete cascade,
  nama        text          not null,

  jumlah_pcs  smallint      check (jumlah_pcs > 0),
  harga_jual  numeric(12,2) not null default 0 check (harga_jual >= 0),

  modal_bahan numeric(12,2) not null default 0 check (modal_bahan >= 0),
  aktif       boolean       not null default true,
  created_at  timestamptz   not null default now(),

 
  constraint variants_harga_aktif_check
    check (not aktif or harga_jual > 0),


  constraint variants_nama_check
    check (nama = btrim(nama) and length(nama) between 1 and 50)
);


create unique index variants_product_nama_uniq
  on public.variants (product_id, lower(nama));


alter table public.variants enable row level security;

create policy "pengelola_akses_penuh" on public.variants
  for all to authenticated
  using (internal.is_pengelola())
  with check (internal.is_pengelola());

revoke all on table public.variants from anon, authenticated;
grant select, insert, update, delete on table public.variants to authenticated;

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
