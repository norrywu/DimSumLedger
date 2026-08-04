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

insert into public.categories (id, nama) values
  ('2602965a-789c-4ccc-b112-56d2a5cb34a7', 'original')
on conflict do nothing;

insert into public.packagings (id, nama, harga_satuan) values
  ('3ec32796-e4c4-4a9a-a8c0-c26e3d1534c4', 'mika', 100)
on conflict do nothing;

insert into public.products (id, category_id, nama) values
  ('9c886484-3d46-43cc-ae2a-fe21a46a017b',
   '2602965a-789c-4ccc-b112-56d2a5cb34a7',
   'dimsum mentai')
on conflict do nothing;

insert into public.variants
  (id, product_id, nama, jumlah_pcs, harga_jual, modal_bahan, aktif) values
  ('3de8c7a3-6b4b-4eed-bf79-1e52f1bc8384',
   '9c886484-3d46-43cc-ae2a-fe21a46a017b',
   'isi 4', 4, 20000, 10000, true)
on conflict do nothing;

insert into public.variant_packagings (variant_id, packaging_id, jumlah) values
  ('3de8c7a3-6b4b-4eed-bf79-1e52f1bc8384',
   '3ec32796-e4c4-4a9a-a8c0-c26e3d1534c4',
   1)
on conflict do nothing;

insert into public.modifiers (id, nama, tambahan_harga, tambahan_modal) values
  ('67390c92-cae0-46cd-a26b-d2fa50854e7f', 'chili oil', 5000, 5000)
on conflict do nothing;
