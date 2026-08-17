-- Dijalankan otomatis oleh `supabase db reset`. Urutannya mengikuti foreign key.
--
-- JANGAN jalankan ke database produksi: tiga akun di bawah memakai sandi yang
-- sama, dan sandi itu tertulis apa adanya di file ini.

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select '00000000-0000-0000-0000-000000000000', u.id,
       'authenticated', 'authenticated', u.email,
       extensions.crypt('password', extensions.gen_salt('bf')),
       now(), now(), now(),
       '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
       '', '', '', ''
  from (values
    ('11111111-1111-4111-8111-111111111111'::uuid, 'owner@mail.com'),
    ('22222222-2222-4222-8222-222222222222'::uuid, 'admin@mail.com'),
    ('33333333-3333-4333-8333-333333333333'::uuid, 'kasir@mail.com')
  ) as u(id, email)
on conflict (id) do nothing;

insert into auth.identities (
  provider_id, user_id, identity_data, provider,
  created_at, updated_at, last_sign_in_at
)
select u.id::text, u.id,
       jsonb_build_object('sub', u.id::text, 'email', u.email,
                          'email_verified', true, 'phone_verified', false),
       'email', now(), now(), now()
  from auth.users u
 where u.id in ('11111111-1111-4111-8111-111111111111',
                '22222222-2222-4222-8222-222222222222',
                '33333333-3333-4333-8333-333333333333')
on conflict do nothing;

-- Trigger `on_profile_updated` menyalin name dan role ke auth.users, jadi klaim
-- app_metadata.role yang dibaca `internal.is_pengelola()` terisi dari sini.
insert into public.profiles (id, name, role) values
  ('11111111-1111-4111-8111-111111111111', 'Pemilik',    'owner'),
  ('22222222-2222-4222-8222-222222222222', 'Admin Toko', 'admin'),
  ('33333333-3333-4333-8333-333333333333', 'Kasir',      'cashier')
on conflict do nothing;

/* =====================================================================
   KATALOG & TRANSAKSI CONTOH — DINONAKTIFKAN
   ---------------------------------------------------------------------
   Seed hanya menyiapkan tiga akun beserta profilnya. Katalog dan 60 nota
   contoh di bawah ini sengaja dimatikan supaya `db reset` menghasilkan
   database bersih yang isinya diisi lewat aplikasi.

   Untuk menghidupkan lagi: hapus baris pembuka ini dan penutupnya di akhir
   berkas. Urutannya sudah benar (kategori → kemasan → produk → varian →
   modifier → transaksi), jadi tidak perlu disusun ulang.
   ===================================================================== */

-- insert into public.categories (id, nama) values
--   ('2602965a-789c-4ccc-b112-56d2a5cb34a7', 'original')
-- on conflict do nothing;

-- insert into public.packagings (id, nama, harga_satuan) values
--   ('3ec32796-e4c4-4a9a-a8c0-c26e3d1534c4', 'mika', 100)
-- on conflict do nothing;

-- insert into public.products (id, category_id, nama, upah_per_pcs) values
--   ('9c886484-3d46-43cc-ae2a-fe21a46a017b',
--    '2602965a-789c-4ccc-b112-56d2a5cb34a7',
--    'dimsum mentai', 500)
-- on conflict do nothing;

-- insert into public.variants
--   (id, product_id, nama, jumlah_pcs, harga_jual, modal_bahan, aktif) values
--   ('3de8c7a3-6b4b-4eed-bf79-1e52f1bc8384',
--    '9c886484-3d46-43cc-ae2a-fe21a46a017b',
--    'isi 4', 4, 20000, 10000, true)
-- on conflict do nothing;

-- insert into public.variant_packagings (variant_id, packaging_id, jumlah) values
--   ('3de8c7a3-6b4b-4eed-bf79-1e52f1bc8384',
--    '3ec32796-e4c4-4a9a-a8c0-c26e3d1534c4',
--    1)
-- on conflict do nothing;

-- -- Tarif berbeda dari mentai supaya laporan menguji bahwa upah benar-benar
-- -- mengikuti produknya, bukan satu angka global.
-- insert into public.products (id, category_id, nama, upah_per_pcs) values
--   ('7b2f1c40-2a55-4f0e-9a71-4c1d2f8e6b31',
--    '2602965a-789c-4ccc-b112-56d2a5cb34a7',
--    'dimsum ayam', 400)
-- on conflict do nothing;

-- insert into public.variants
--   (id, product_id, nama, jumlah_pcs, harga_jual, modal_bahan, aktif) values
--   ('8a1e5d62-9c34-4b77-8f20-1d5a3e9c7b48',
--    '9c886484-3d46-43cc-ae2a-fe21a46a017b',
--    'isi 8', 8, 36000, 19000, true),
--   ('c4d7f318-6e29-4a83-b5c1-70f2a8d94e56',
--    '7b2f1c40-2a55-4f0e-9a71-4c1d2f8e6b31',
--    'isi 4', 4, 18000, 8500, true)
-- on conflict do nothing;

-- insert into public.variant_packagings (variant_id, packaging_id, jumlah) values
--   ('8a1e5d62-9c34-4b77-8f20-1d5a3e9c7b48',
--    '3ec32796-e4c4-4a9a-a8c0-c26e3d1534c4', 2),
--   ('c4d7f318-6e29-4a83-b5c1-70f2a8d94e56',
--    '3ec32796-e4c4-4a9a-a8c0-c26e3d1534c4', 1)
-- on conflict do nothing;


-- insert into public.modifiers (id, nama, tambahan_harga, tambahan_modal) values
--   ('67390c92-cae0-46cd-a26b-d2fa50854e7f', 'chili oil', 5000, 5000),
--   ('b93a4e17-5f68-42d0-9c3b-8e21d7f604a5', 'saus keju', 8000, 3000)
-- on conflict do nothing;


-- do $$
-- declare
--   v_tx       uuid;
--   v_item     uuid;
--   v_var      record;
--   v_n        integer;
--   v_i        integer;
--   v_qty      integer;
--   v_total    numeric(12,2);
--   v_tambahan numeric(12,2);
--   v_batal    boolean;
--   v_waktu    timestamptz;
--   v_kasir    uuid;
--   v_nama     text;
-- begin

--   if exists (select 1 from public.transaksi) then
--     return;
--   end if;

--   for v_n in 1..60 loop

--     v_waktu := now() - ((60 - v_n) * interval '11 hours');
--     v_batal := (v_n % 17 = 0);

--     if v_n % 7 = 0 then
--       v_kasir := '22222222-2222-4222-8222-222222222222';
--       v_nama  := 'Admin Toko';
--     else
--       v_kasir := '33333333-3333-4333-8333-333333333333';
--       v_nama  := 'Kasir';
--     end if;

--     insert into public.transaksi
--       (kasir_id, kasir_nama, status, total, dibayar, created_at, dibatalkan_at)
--     values
--       (v_kasir, v_nama,
--        case when v_batal then 'dibatalkan' else 'selesai' end,
--        0, 0, v_waktu,
--        case when v_batal then v_waktu + interval '3 minutes' end)
--     returning id into v_tx;

--     v_total := 0;

--     for v_i in 1..((v_n % 2) + 1) loop
--       select h.id, h.nama, h.produk_nama, h.jumlah_pcs, h.harga_jual,
--              h.modal_bahan, h.modal_kemasan
--         into v_var
--         from public.v_hpp_varian h
--        where h.aktif
--        order by h.produk_nama, h.nama
--       offset ((v_n + v_i) % 3) limit 1;

--       v_qty := (v_n % 4) + 1;

--       insert into public.transaksi_item
--         (transaksi_id, variant_id, nama_produk, nama_varian, jumlah_pcs,
--          harga_satuan, modal_bahan_satuan, modal_kemasan_satuan, qty)
--       values
--         (v_tx, v_var.id, v_var.produk_nama, v_var.nama, v_var.jumlah_pcs,
--          v_var.harga_jual, v_var.modal_bahan, v_var.modal_kemasan, v_qty)
--       returning id into v_item;

--       insert into public.transaksi_item_modifier
--         (transaksi_item_id, modifier_id, nama, tambahan_harga, tambahan_modal)
--       select v_item, m.id, m.nama, m.tambahan_harga, m.tambahan_modal
--         from public.modifiers m
--        where (m.nama = 'chili oil' and (v_n + v_i) % 3 = 0)
--           or (m.nama = 'saus keju' and (v_n + v_i) % 5 = 0);

--       select coalesce(sum(tim.tambahan_harga), 0) into v_tambahan
--         from public.transaksi_item_modifier tim
--        where tim.transaksi_item_id = v_item;

--       v_total := v_total + (v_var.harga_jual + v_tambahan) * v_qty;
--     end loop;

 
--     update public.transaksi
--        set total   = v_total,
--            dibayar = case
--                        when v_n % 3 = 0 then v_total
--                        else ceil(v_total / 10000) * 10000
--                      end
--      where id = v_tx;
--   end loop;
-- end $$;

-- /* ===== akhir bagian yang dinonaktifkan ===== */
