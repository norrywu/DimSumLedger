

create table public.products (
  id          uuid        primary key default gen_random_uuid(),
  category_id uuid        not null references public.categories (id) on delete restrict,
  nama        text        not null,

  -- Upah/reward per POTONG, bukan per porsi: yang dibayar adalah kerja membuat
  -- tiap butir, jadi "isi 8" otomatis dua kali "isi 4" tanpa diisi ulang.
  -- Diletakkan di produk, bukan varian, karena varian dari produk yang sama
  -- adalah dimsum yang sama — hanya beda banyak isinya.
  upah_per_pcs numeric(12,2) not null default 0 check (upah_per_pcs >= 0),
  lacak_stok   boolean       not null default false,
  stok_pcs     integer       not null default 0 check (stok_pcs >= 0),

  created_at  timestamptz not null default now(),

  constraint products_nama_check
    check (nama = btrim(nama) and length(nama) between 1 and 50)
);


create unique index products_nama_uniq on public.products (lower(nama));

create index products_category_idx on public.products (category_id, nama);

-- --- Keamanan -----------------------------------------------
alter table public.products enable row level security;

create policy "pengelola_akses_penuh" on public.products
  for all to authenticated
  using (internal.is_pengelola())
  with check (internal.is_pengelola());

revoke all on table public.products from anon, authenticated;
grant select, insert, update, delete on table public.products to authenticated;

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
