SET check_function_bodies = false;
CREATE SCHEMA internal AUTHORIZATION postgres;
GRANT USAGE ON SCHEMA internal TO authenticated;
CREATE FUNCTION internal.is_pengelola()
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  SELECT coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('owner', 'admin'),
    false
  );
$function$;
GRANT ALL ON FUNCTION internal.is_pengelola() TO authenticated;
CREATE FUNCTION internal.sync_profile_to_auth()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  UPDATE auth.users
  SET
   raw_user_meta_data =
      COALESCE(raw_user_meta_data, '{}'::jsonb) ||
      jsonb_build_object('name', NEW.name),
   raw_app_meta_data =
      COALESCE(raw_app_meta_data, '{}'::jsonb) ||
      jsonb_build_object('role', NEW.role)
  WHERE id = NEW.id;

  RETURN NEW;
END;
$function$;
CREATE FUNCTION public.daftar_pengguna()
 RETURNS TABLE(id uuid, name text, role text, email text, created_at timestamp with time zone, last_sign_in_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  IF NOT internal.is_pengelola() THEN
    RAISE EXCEPTION 'Kamu tidak punya akses melihat daftar pengguna.';
  END IF;

  RETURN QUERY
  -- JOIN, bukan LEFT JOIN: `profiles.id` punya FK ke `auth.users` dengan
  -- ON DELETE CASCADE, jadi baris profil tanpa akun auth tidak mungkin ada.
  --
  -- `auth.users.email` bertipe varchar(255); tanpa cast, Postgres menolak
  -- fungsinya karena tidak cocok dengan `text` di RETURNS TABLE.
  SELECT p.id, p.name, p.role, u.email::text, p.created_at, u.last_sign_in_at
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.id
   ORDER BY p.name;
END;
$function$;
GRANT ALL ON FUNCTION public.daftar_pengguna() TO authenticated;
CREATE FUNCTION public.simpan_varian(p_id uuid, p_product_id uuid, p_nama text, p_jumlah_pcs smallint, p_harga_jual numeric, p_modal_bahan numeric, p_aktif boolean, p_kemasan jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
  v_id uuid;
BEGIN
  -- Inti aturannya: varian tanpa kemasan bukan barang yang bisa dijual.
  IF p_kemasan IS NULL OR jsonb_array_length(p_kemasan) < 1 THEN
    RAISE EXCEPTION 'Varian wajib punya minimal satu kemasan.';
  END IF;

  -- Tanpa penjagaan ini, ON CONFLICT DO UPDATE di bawah melempar 21000
  -- ("cannot affect row a second time") yang tidak bisa dibaca siapa pun.
  -- UI sudah menyaring pilihan yang sudah dipakai; ini jaring pengaman.
  IF (SELECT count(*) FROM jsonb_array_elements(p_kemasan)) <> (
       SELECT count(DISTINCT baris->>'packaging_id')
         FROM jsonb_array_elements(p_kemasan) baris
     ) THEN
    RAISE EXCEPTION 'Kemasan tidak boleh kembar dalam satu varian.';
  END IF;

  IF p_id IS NULL THEN
    INSERT INTO public.variants
      (product_id, nama, jumlah_pcs, harga_jual, modal_bahan, aktif)
    VALUES
      (p_product_id, p_nama, p_jumlah_pcs, p_harga_jual, p_modal_bahan, p_aktif)
    RETURNING id INTO v_id;
  ELSE
    UPDATE public.variants
       SET product_id  = p_product_id,
           nama        = p_nama,
           jumlah_pcs  = p_jumlah_pcs,
           harga_jual  = p_harga_jual,
           modal_bahan = p_modal_bahan,
           aktif       = p_aktif
     WHERE id = p_id
    RETURNING id INTO v_id;

    -- Nol baris terpengaruh: barisnya keburu dihapus orang lain, atau RLS
    -- menyembunyikannya. Tanpa cek ini, daftar kemasan di bawah akan ditulis
    -- untuk variant_id NULL dan gagal dengan pesan yang membingungkan.
    IF v_id IS NULL THEN
      RAISE EXCEPTION 'Varian sudah tidak ada. Muat ulang halaman.';
    END IF;
  END IF;

  -- Daftar kemasannya diganti total, bukan ditambal: yang hilang dari kiriman
  -- berarti memang dicabut pengguna.
  --
  -- NOT EXISTS, bukan `packaging_id NOT IN (...)` — NOT IN diam-diam
  -- mengembalikan nol baris begitu ada satu NULL di dalam daftarnya.
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
$function$;
GRANT ALL ON FUNCTION public.simpan_varian(uuid, uuid, text, smallint, numeric, numeric, boolean, jsonb) TO authenticated;
CREATE TABLE public.categories (id uuid DEFAULT gen_random_uuid() NOT NULL, nama text NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ADD CONSTRAINT categories_pkey PRIMARY KEY (id);
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.categories TO anon;
GRANT ALL ON public.categories TO authenticated;
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.categories TO service_role;
CREATE UNIQUE INDEX categories_nama_uniq ON public.categories (lower(nama));
CREATE POLICY pengelola_akses_penuh ON public.categories TO authenticated USING (internal.is_pengelola()) WITH CHECK (internal.is_pengelola());
CREATE TABLE public.modifiers (id uuid DEFAULT gen_random_uuid() NOT NULL, nama text NOT NULL, price numeric(12,2) DEFAULT 0 NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL);
ALTER TABLE public.modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modifiers ADD CONSTRAINT modifiers_pkey PRIMARY KEY (id);
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.modifiers TO anon;
GRANT ALL ON public.modifiers TO authenticated;
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.modifiers TO service_role;
CREATE UNIQUE INDEX modifiers_nama_uniq ON public.modifiers (lower(nama));
CREATE POLICY pengelola_akses_penuh ON public.modifiers TO authenticated USING (internal.is_pengelola()) WITH CHECK (internal.is_pengelola());
CREATE TABLE public.packagings (id uuid DEFAULT gen_random_uuid() NOT NULL, nama text NOT NULL, harga_satuan numeric(12,2) DEFAULT 0 NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL);
ALTER TABLE public.packagings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packagings ADD CONSTRAINT packagings_harga_satuan_check CHECK (harga_satuan >= 0::numeric);
ALTER TABLE public.packagings ADD CONSTRAINT packagings_pkey PRIMARY KEY (id);
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.packagings TO anon;
GRANT ALL ON public.packagings TO authenticated;
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.packagings TO service_role;
CREATE UNIQUE INDEX packagings_nama_uniq ON public.packagings (lower(nama));
CREATE POLICY pengelola_akses_penuh ON public.packagings TO authenticated USING (internal.is_pengelola()) WITH CHECK (internal.is_pengelola());
CREATE TABLE public.products (id uuid DEFAULT gen_random_uuid() NOT NULL, category_id uuid NOT NULL, nama text NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE RESTRICT;
ALTER TABLE public.products ADD CONSTRAINT products_pkey PRIMARY KEY (id);
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.products TO anon;
GRANT ALL ON public.products TO authenticated;
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.products TO service_role;
CREATE UNIQUE INDEX products_nama_uniq ON public.products (lower(nama));
CREATE INDEX products_category_idx ON public.products (category_id, nama);
CREATE POLICY pengelola_akses_penuh ON public.products TO authenticated USING (internal.is_pengelola()) WITH CHECK (internal.is_pengelola());
CREATE TABLE public.profiles (id uuid NOT NULL, name text NOT NULL, role text DEFAULT 'cashier'::text NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL, updated_at timestamp with time zone);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role = ANY (ARRAY['owner'::text, 'admin'::text, 'cashier'::text]));
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.profiles TO anon;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
CREATE TRIGGER on_profile_updated AFTER INSERT OR UPDATE OF name, role ON public.profiles FOR EACH ROW EXECUTE FUNCTION internal.sync_profile_to_auth();
CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles profiles_1
  WHERE ((profiles_1.id = auth.uid()) AND (profiles_1.role = 'admin'::text))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles profiles_1
  WHERE ((profiles_1.id = auth.uid()) AND (profiles_1.role = 'admin'::text)))));
CREATE POLICY "Allow insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK ((auth.uid() = id));
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT TO authenticated USING ((auth.uid() = id));
CREATE POLICY "Users can update own name" ON public.profiles FOR UPDATE TO authenticated USING ((auth.uid() = id)) WITH CHECK (((auth.uid() = id) AND (role = ( SELECT profiles_1.role
   FROM public.profiles profiles_1
  WHERE (profiles_1.id = auth.uid())))));
CREATE TABLE public.variant_packagings (variant_id uuid NOT NULL, packaging_id uuid NOT NULL, jumlah smallint DEFAULT 1 NOT NULL);
ALTER TABLE public.variant_packagings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variant_packagings ADD CONSTRAINT variant_packagings_jumlah_check CHECK (jumlah > 0);
ALTER TABLE public.variant_packagings ADD CONSTRAINT variant_packagings_packaging_id_fkey FOREIGN KEY (packaging_id) REFERENCES public.packagings(id) ON DELETE RESTRICT;
ALTER TABLE public.variant_packagings ADD CONSTRAINT variant_packagings_pkey PRIMARY KEY (variant_id, packaging_id);
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.variant_packagings TO anon;
GRANT ALL ON public.variant_packagings TO authenticated;
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.variant_packagings TO service_role;
CREATE INDEX variant_packagings_packaging_idx ON public.variant_packagings (packaging_id);
CREATE POLICY pengelola_akses_penuh ON public.variant_packagings TO authenticated USING (internal.is_pengelola()) WITH CHECK (internal.is_pengelola());
CREATE TABLE public.variants (id uuid DEFAULT gen_random_uuid() NOT NULL, product_id uuid NOT NULL, nama text NOT NULL, jumlah_pcs smallint, harga_jual numeric(12,2) DEFAULT 0 NOT NULL, modal_bahan numeric(12,2) DEFAULT 0 NOT NULL, aktif boolean DEFAULT true NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL);
ALTER TABLE public.variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variants ADD CONSTRAINT variants_harga_jual_check CHECK (harga_jual >= 0::numeric);
ALTER TABLE public.variants ADD CONSTRAINT variants_jumlah_pcs_check CHECK (jumlah_pcs > 0);
ALTER TABLE public.variants ADD CONSTRAINT variants_modal_bahan_check CHECK (modal_bahan >= 0::numeric);
ALTER TABLE public.variants ADD CONSTRAINT variants_pkey PRIMARY KEY (id);
ALTER TABLE public.variant_packagings ADD CONSTRAINT variant_packagings_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.variants(id) ON DELETE CASCADE;
ALTER TABLE public.variants ADD CONSTRAINT variants_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
ALTER TABLE public.variants ADD CONSTRAINT variants_product_id_nama_key UNIQUE (product_id, nama);
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.variants TO anon;
GRANT ALL ON public.variants TO authenticated;
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.variants TO service_role;
CREATE INDEX variants_product_idx ON public.variants (product_id, nama);
CREATE POLICY pengelola_akses_penuh ON public.variants TO authenticated USING (internal.is_pengelola()) WITH CHECK (internal.is_pengelola());
