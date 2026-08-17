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
CREATE FUNCTION public.batalkan_transaksi(p_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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
$function$;
GRANT ALL ON FUNCTION public.batalkan_transaksi(uuid) TO authenticated;
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
CREATE FUNCTION public.laporan_penjualan(p_dari timestamp with time zone, p_sampai timestamp with time zone)
 RETURNS TABLE(nama_produk text, nama_varian text, nama_kategori text, porsi bigint, pcs bigint, omzet numeric, modal_bahan numeric, modal_kemasan numeric, modal_upah numeric, modal_extra numeric, modal numeric, laba numeric, kasir_id uuid, kasir_nama text)
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  select v.nama_produk,
         v.nama_varian,
         v.nama_kategori,
         sum(v.qty)::bigint,
         sum(v.pcs)::bigint,
         sum(v.omzet),
         sum(v.modal_bahan),
         sum(v.modal_kemasan),
         sum(v.modal_upah),
         sum(v.modal_extra),
         sum(v.modal),
         sum(v.laba),
         v.kasir_id,
         v.kasir_nama
    from public.v_penjualan_item v
   -- Transaksi yang dibatalkan tidak pernah jadi omzet.
   where v.status = 'selesai'
     and v.created_at >= p_dari
     and v.created_at <  p_sampai
   group by v.nama_produk, v.nama_varian, v.nama_kategori, v.kasir_id, v.kasir_nama
   order by sum(v.omzet) desc;
$function$;
GRANT ALL ON FUNCTION public.laporan_penjualan(timestamp with time zone, timestamp with time zone) TO authenticated;
CREATE FUNCTION public.setor_omzet_harian(p_tanggal date)
 RETURNS numeric
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_omzet numeric(12,2);
  v_awal  timestamptz;
  v_akhir timestamptz;
begin
  -- TimeZone database UTC, "hari" toko adalah WIB.
  v_awal  := p_tanggal::timestamp       at time zone 'Asia/Jakarta';
  v_akhir := (p_tanggal + 1)::timestamp at time zone 'Asia/Jakarta';

  select coalesce(sum(t.total), 0) into v_omzet
    from public.transaksi t
   where t.status = 'selesai'
     and t.created_at >= v_awal
     and t.created_at <  v_akhir;

  if v_omzet <= 0 then
    raise exception 'Belum ada penjualan pada % yang bisa disetor.', p_tanggal;
  end if;

  insert into public.cash_flow
    (type, amount, category, description, source, transaction_date)
  values
    ('income', v_omzet, 'Penjualan', 'Setoran omzet POS', 'pos', p_tanggal)
  on conflict (transaction_date) where source = 'pos'
  do update set amount = excluded.amount;

  return v_omzet;
end;
$function$;
GRANT ALL ON FUNCTION public.setor_omzet_harian(date) TO authenticated;
CREATE FUNCTION public.simpan_transaksi(p_items jsonb, p_dibayar numeric)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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

  -- Dicek di sini, bukan diserahkan ke `transaksi_bayar_check`, supaya kasir
  -- dapat pesan berisi angkanya — bukan sekadar constraint violation.
  if p_dibayar is null or p_dibayar < v_total then
    raise exception 'Uang yang dibayarkan kurang. Total %, dibayar %.',
      v_total, coalesce(p_dibayar, 0);
  end if;

  update public.transaksi
     set total = v_total, dibayar = p_dibayar
   where id = v_transaksi_id;

  return v_transaksi_id;
end;
$function$;
GRANT ALL ON FUNCTION public.simpan_transaksi(jsonb, numeric) TO authenticated;
CREATE FUNCTION public.simpan_varian(p_id uuid, p_product_id uuid, p_nama text, p_jumlah_pcs smallint, p_harga_jual numeric, p_modal_bahan numeric, p_aktif boolean, p_kemasan jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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
$function$;
GRANT ALL ON FUNCTION public.simpan_varian(uuid, uuid, text, smallint, numeric, numeric, boolean, jsonb) TO authenticated;
CREATE TABLE public.cash_flow (id uuid DEFAULT gen_random_uuid() NOT NULL, type text NOT NULL, amount numeric(12,2) NOT NULL, category text NOT NULL, description text, source text DEFAULT 'manual'::text NOT NULL, transaction_date date DEFAULT CURRENT_DATE NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL);
ALTER TABLE public.cash_flow ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_flow ADD CONSTRAINT cash_flow_amount_check CHECK (amount > 0::numeric);
ALTER TABLE public.cash_flow ADD CONSTRAINT cash_flow_category_check CHECK (category = btrim(category) AND length(category) >= 1 AND length(category) <= 50);
ALTER TABLE public.cash_flow ADD CONSTRAINT cash_flow_description_check CHECK (description IS NULL OR btrim(description) <> ''::text);
ALTER TABLE public.cash_flow ADD CONSTRAINT cash_flow_pkey PRIMARY KEY (id);
ALTER TABLE public.cash_flow ADD CONSTRAINT cash_flow_source_check CHECK (source = ANY (ARRAY['manual'::text, 'pos'::text]));
ALTER TABLE public.cash_flow ADD CONSTRAINT cash_flow_type_check CHECK (type = ANY (ARRAY['income'::text, 'expense'::text]));
GRANT DELETE, INSERT, SELECT, UPDATE ON public.cash_flow TO authenticated;
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.cash_flow TO service_role;
CREATE INDEX cash_flow_tanggal_idx ON public.cash_flow (transaction_date DESC);
CREATE UNIQUE INDEX cash_flow_pos_harian_uniq ON public.cash_flow (transaction_date) WHERE source = 'pos'::text;
CREATE POLICY pengelola_akses_penuh ON public.cash_flow TO authenticated USING (internal.is_pengelola()) WITH CHECK (internal.is_pengelola());
CREATE TABLE public.categories (id uuid DEFAULT gen_random_uuid() NOT NULL, nama text NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ADD CONSTRAINT categories_nama_check CHECK (nama = btrim(nama) AND length(nama) >= 1 AND length(nama) <= 50);
ALTER TABLE public.categories ADD CONSTRAINT categories_pkey PRIMARY KEY (id);
GRANT DELETE, INSERT, SELECT, UPDATE ON public.categories TO authenticated;
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.categories TO service_role;
CREATE UNIQUE INDEX categories_nama_uniq ON public.categories (lower(nama));
CREATE POLICY pengelola_akses_penuh ON public.categories TO authenticated USING (internal.is_pengelola()) WITH CHECK (internal.is_pengelola());
CREATE TABLE public.modifiers (id uuid DEFAULT gen_random_uuid() NOT NULL, nama text NOT NULL, tambahan_harga numeric(12,2) DEFAULT 0 NOT NULL, tambahan_modal numeric(12,2) DEFAULT 0 NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL);
ALTER TABLE public.modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modifiers ADD CONSTRAINT modifiers_nama_check CHECK (nama = btrim(nama) AND length(nama) >= 1 AND length(nama) <= 50);
ALTER TABLE public.modifiers ADD CONSTRAINT modifiers_pkey PRIMARY KEY (id);
ALTER TABLE public.modifiers ADD CONSTRAINT modifiers_tambahan_harga_check CHECK (tambahan_harga >= 0::numeric);
ALTER TABLE public.modifiers ADD CONSTRAINT modifiers_tambahan_modal_check CHECK (tambahan_modal >= 0::numeric);
GRANT DELETE, INSERT, SELECT, UPDATE ON public.modifiers TO authenticated;
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.modifiers TO service_role;
CREATE UNIQUE INDEX modifiers_nama_uniq ON public.modifiers (lower(nama));
CREATE POLICY pengelola_akses_penuh ON public.modifiers TO authenticated USING (internal.is_pengelola()) WITH CHECK (internal.is_pengelola());
CREATE TABLE public.packagings (id uuid DEFAULT gen_random_uuid() NOT NULL, nama text NOT NULL, harga_satuan numeric(12,2) DEFAULT 0 NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL);
ALTER TABLE public.packagings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packagings ADD CONSTRAINT packagings_harga_satuan_check CHECK (harga_satuan >= 0::numeric);
ALTER TABLE public.packagings ADD CONSTRAINT packagings_nama_check CHECK (nama = btrim(nama) AND length(nama) >= 1 AND length(nama) <= 50);
ALTER TABLE public.packagings ADD CONSTRAINT packagings_pkey PRIMARY KEY (id);
GRANT DELETE, INSERT, SELECT, UPDATE ON public.packagings TO authenticated;
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.packagings TO service_role;
CREATE UNIQUE INDEX packagings_nama_uniq ON public.packagings (lower(nama));
CREATE POLICY pengelola_akses_penuh ON public.packagings TO authenticated USING (internal.is_pengelola()) WITH CHECK (internal.is_pengelola());
CREATE TABLE public.products (id uuid DEFAULT gen_random_uuid() NOT NULL, category_id uuid NOT NULL, nama text NOT NULL, upah_per_pcs numeric(12,2) DEFAULT 0 NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE RESTRICT;
ALTER TABLE public.products ADD CONSTRAINT products_nama_check CHECK (nama = btrim(nama) AND length(nama) >= 1 AND length(nama) <= 50);
ALTER TABLE public.products ADD CONSTRAINT products_pkey PRIMARY KEY (id);
ALTER TABLE public.products ADD CONSTRAINT products_upah_per_pcs_check CHECK (upah_per_pcs >= 0::numeric);
GRANT DELETE, INSERT, SELECT, UPDATE ON public.products TO authenticated;
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.products TO service_role;
CREATE UNIQUE INDEX products_nama_uniq ON public.products (lower(nama));
CREATE INDEX products_category_idx ON public.products (category_id, nama);
CREATE POLICY pengelola_akses_penuh ON public.products TO authenticated USING (internal.is_pengelola()) WITH CHECK (internal.is_pengelola());
CREATE TABLE public.profiles (id uuid NOT NULL, name text NOT NULL, role text DEFAULT 'cashier'::text NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL, updated_at timestamp with time zone);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role = ANY (ARRAY['owner'::text, 'admin'::text, 'cashier'::text]));
GRANT INSERT, SELECT, UPDATE ON public.profiles TO authenticated;
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
CREATE TABLE public.transaksi (id uuid DEFAULT gen_random_uuid() NOT NULL, kasir_id uuid, kasir_nama text NOT NULL, status text DEFAULT 'selesai'::text NOT NULL, total numeric(12,2) NOT NULL, dibayar numeric(12,2) DEFAULT 0 NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL, dibatalkan_at timestamp with time zone);
ALTER TABLE public.transaksi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaksi ADD CONSTRAINT transaksi_batal_check CHECK ((status = 'dibatalkan'::text) = (dibatalkan_at IS NOT NULL));
ALTER TABLE public.transaksi ADD CONSTRAINT transaksi_bayar_check CHECK (dibayar >= total);
ALTER TABLE public.transaksi ADD CONSTRAINT transaksi_dibayar_check CHECK (dibayar >= 0::numeric);
ALTER TABLE public.transaksi ADD CONSTRAINT transaksi_kasir_id_fkey FOREIGN KEY (kasir_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.transaksi ADD CONSTRAINT transaksi_kasir_nama_check CHECK (kasir_nama = btrim(kasir_nama) AND length(kasir_nama) >= 1);
ALTER TABLE public.transaksi ADD CONSTRAINT transaksi_pkey PRIMARY KEY (id);
ALTER TABLE public.transaksi ADD CONSTRAINT transaksi_status_check CHECK (status = ANY (ARRAY['selesai'::text, 'dibatalkan'::text]));
ALTER TABLE public.transaksi ADD CONSTRAINT transaksi_total_check CHECK (total >= 0::numeric);
GRANT INSERT, SELECT ON public.transaksi TO authenticated;
GRANT UPDATE (dibatalkan_at, status) ON public.transaksi TO authenticated;
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.transaksi TO service_role;
CREATE INDEX transaksi_created_idx ON public.transaksi (created_at DESC);
CREATE INDEX transaksi_kasir_idx ON public.transaksi (kasir_id, created_at DESC);
CREATE POLICY kasir_baca_transaksi_sendiri ON public.transaksi FOR SELECT TO authenticated USING ((kasir_id = ( SELECT auth.uid() AS uid)));
CREATE POLICY kasir_batalkan_transaksi_baru ON public.transaksi FOR UPDATE TO authenticated USING (((kasir_id = ( SELECT auth.uid() AS uid)) AND (status = 'selesai'::text) AND (created_at > (now() - '00:10:00'::interval)))) WITH CHECK (((kasir_id = ( SELECT auth.uid() AS uid)) AND (status = 'dibatalkan'::text)));
CREATE POLICY kasir_catat_transaksi ON public.transaksi FOR INSERT TO authenticated WITH CHECK ((kasir_id = ( SELECT auth.uid() AS uid)));
CREATE POLICY pengelola_akses_penuh ON public.transaksi TO authenticated USING (internal.is_pengelola()) WITH CHECK (internal.is_pengelola());
CREATE TABLE public.transaksi_item (id uuid DEFAULT gen_random_uuid() NOT NULL, transaksi_id uuid NOT NULL, variant_id uuid, nama_produk text NOT NULL, nama_varian text NOT NULL, jumlah_pcs smallint, harga_satuan numeric(12,2) NOT NULL, modal_bahan_satuan numeric(12,2) NOT NULL, modal_kemasan_satuan numeric(12,2) NOT NULL, modal_upah_satuan numeric(12,2) DEFAULT 0 NOT NULL, hpp_satuan numeric(12,2) GENERATED ALWAYS AS (((modal_bahan_satuan + modal_kemasan_satuan) + modal_upah_satuan)) STORED NOT NULL, qty smallint NOT NULL);
ALTER TABLE public.transaksi_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaksi_item ADD CONSTRAINT transaksi_item_harga_satuan_check CHECK (harga_satuan >= 0::numeric);
ALTER TABLE public.transaksi_item ADD CONSTRAINT transaksi_item_jumlah_pcs_check CHECK (jumlah_pcs > 0);
ALTER TABLE public.transaksi_item ADD CONSTRAINT transaksi_item_modal_bahan_satuan_check CHECK (modal_bahan_satuan >= 0::numeric);
ALTER TABLE public.transaksi_item ADD CONSTRAINT transaksi_item_modal_kemasan_satuan_check CHECK (modal_kemasan_satuan >= 0::numeric);
ALTER TABLE public.transaksi_item ADD CONSTRAINT transaksi_item_modal_upah_satuan_check CHECK (modal_upah_satuan >= 0::numeric);
ALTER TABLE public.transaksi_item ADD CONSTRAINT transaksi_item_pkey PRIMARY KEY (id);
ALTER TABLE public.transaksi_item ADD CONSTRAINT transaksi_item_qty_check CHECK (qty > 0);
ALTER TABLE public.transaksi_item ADD CONSTRAINT transaksi_item_transaksi_id_fkey FOREIGN KEY (transaksi_id) REFERENCES public.transaksi(id) ON DELETE CASCADE;
GRANT INSERT, SELECT ON public.transaksi_item TO authenticated;
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.transaksi_item TO service_role;
CREATE INDEX transaksi_item_variant_idx ON public.transaksi_item (variant_id);
CREATE INDEX transaksi_item_transaksi_idx ON public.transaksi_item (transaksi_id);
CREATE POLICY baca_ikut_induk ON public.transaksi_item FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.transaksi t
  WHERE (t.id = transaksi_item.transaksi_id))));
CREATE POLICY tulis_ikut_induk ON public.transaksi_item FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.transaksi t
  WHERE (t.id = transaksi_item.transaksi_id))));
CREATE TABLE public.transaksi_item_modifier (id uuid DEFAULT gen_random_uuid() NOT NULL, transaksi_item_id uuid NOT NULL, modifier_id uuid, nama text NOT NULL, tambahan_harga numeric(12,2) NOT NULL, tambahan_modal numeric(12,2) NOT NULL);
ALTER TABLE public.transaksi_item_modifier ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaksi_item_modifier ADD CONSTRAINT transaksi_item_modifier_modifier_id_fkey FOREIGN KEY (modifier_id) REFERENCES public.modifiers(id) ON DELETE SET NULL;
ALTER TABLE public.transaksi_item_modifier ADD CONSTRAINT transaksi_item_modifier_pkey PRIMARY KEY (id);
ALTER TABLE public.transaksi_item_modifier ADD CONSTRAINT transaksi_item_modifier_tambahan_harga_check CHECK (tambahan_harga >= 0::numeric);
ALTER TABLE public.transaksi_item_modifier ADD CONSTRAINT transaksi_item_modifier_tambahan_modal_check CHECK (tambahan_modal >= 0::numeric);
ALTER TABLE public.transaksi_item_modifier ADD CONSTRAINT transaksi_item_modifier_transaksi_item_id_fkey FOREIGN KEY (transaksi_item_id) REFERENCES public.transaksi_item(id) ON DELETE CASCADE;
ALTER TABLE public.transaksi_item_modifier ADD CONSTRAINT transaksi_item_modifier_transaksi_item_id_modifier_id_key UNIQUE (transaksi_item_id, modifier_id);
GRANT INSERT, SELECT ON public.transaksi_item_modifier TO authenticated;
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.transaksi_item_modifier TO service_role;
CREATE POLICY baca_ikut_induk ON public.transaksi_item_modifier FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.transaksi_item i
  WHERE (i.id = transaksi_item_modifier.transaksi_item_id))));
CREATE POLICY tulis_ikut_induk ON public.transaksi_item_modifier FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.transaksi_item i
  WHERE (i.id = transaksi_item_modifier.transaksi_item_id))));
CREATE TABLE public.variant_packagings (variant_id uuid NOT NULL, packaging_id uuid NOT NULL, jumlah smallint DEFAULT 1 NOT NULL);
ALTER TABLE public.variant_packagings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variant_packagings ADD CONSTRAINT variant_packagings_jumlah_check CHECK (jumlah > 0);
ALTER TABLE public.variant_packagings ADD CONSTRAINT variant_packagings_packaging_id_fkey FOREIGN KEY (packaging_id) REFERENCES public.packagings(id) ON DELETE RESTRICT;
ALTER TABLE public.variant_packagings ADD CONSTRAINT variant_packagings_pkey PRIMARY KEY (variant_id, packaging_id);
GRANT DELETE, INSERT, SELECT, UPDATE ON public.variant_packagings TO authenticated;
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.variant_packagings TO service_role;
CREATE INDEX variant_packagings_packaging_idx ON public.variant_packagings (packaging_id);
CREATE POLICY pengelola_akses_penuh ON public.variant_packagings TO authenticated USING (internal.is_pengelola()) WITH CHECK (internal.is_pengelola());
CREATE TABLE public.variants (id uuid DEFAULT gen_random_uuid() NOT NULL, product_id uuid NOT NULL, nama text NOT NULL, jumlah_pcs smallint, harga_jual numeric(12,2) DEFAULT 0 NOT NULL, modal_bahan numeric(12,2) DEFAULT 0 NOT NULL, aktif boolean DEFAULT true NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL);
ALTER TABLE public.variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variants ADD CONSTRAINT variants_harga_aktif_check CHECK (NOT aktif OR harga_jual > 0::numeric);
ALTER TABLE public.variants ADD CONSTRAINT variants_harga_jual_check CHECK (harga_jual >= 0::numeric);
ALTER TABLE public.variants ADD CONSTRAINT variants_jumlah_pcs_check CHECK (jumlah_pcs > 0);
ALTER TABLE public.variants ADD CONSTRAINT variants_modal_bahan_check CHECK (modal_bahan >= 0::numeric);
ALTER TABLE public.variants ADD CONSTRAINT variants_nama_check CHECK (nama = btrim(nama) AND length(nama) >= 1 AND length(nama) <= 50);
ALTER TABLE public.variants ADD CONSTRAINT variants_pkey PRIMARY KEY (id);
ALTER TABLE public.transaksi_item ADD CONSTRAINT transaksi_item_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.variants(id) ON DELETE SET NULL;
ALTER TABLE public.variant_packagings ADD CONSTRAINT variant_packagings_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.variants(id) ON DELETE CASCADE;
ALTER TABLE public.variants ADD CONSTRAINT variants_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.variants TO authenticated;
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.variants TO service_role;
CREATE UNIQUE INDEX variants_product_nama_uniq ON public.variants (product_id, lower(nama));
CREATE POLICY pengelola_akses_penuh ON public.variants TO authenticated USING (internal.is_pengelola()) WITH CHECK (internal.is_pengelola());
CREATE VIEW public.katalog_extra WITH (security_invoker=false) AS SELECT id,
    nama,
    tambahan_harga
   FROM public.modifiers m;
GRANT SELECT ON public.katalog_extra TO authenticated;
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.katalog_extra TO service_role;
CREATE VIEW public.katalog_jual WITH (security_invoker=false) AS SELECT v.id,
    v.nama AS varian_nama,
    v.jumlah_pcs,
    v.harga_jual,
    p.id AS product_id,
    p.nama AS produk_nama,
    k.id AS category_id,
    k.nama AS kategori_nama
   FROM ((public.variants v
     JOIN public.products p ON ((p.id = v.product_id)))
     JOIN public.categories k ON ((k.id = p.category_id)))
  WHERE v.aktif;
GRANT SELECT ON public.katalog_jual TO authenticated;
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.katalog_jual TO service_role;
CREATE VIEW public.v_hpp_varian WITH (security_invoker=true) AS SELECT v.id,
    v.product_id,
    v.nama,
    v.jumlah_pcs,
    v.harga_jual,
    v.modal_bahan,
    v.aktif,
    p.nama AS produk_nama,
    COALESCE(k.modal_kemasan, (0)::numeric) AS modal_kemasan,
    ((COALESCE((v.jumlah_pcs)::integer, 0))::numeric * p.upah_per_pcs) AS modal_upah,
    ((v.modal_bahan + COALESCE(k.modal_kemasan, (0)::numeric)) + ((COALESCE((v.jumlah_pcs)::integer, 0))::numeric * p.upah_per_pcs)) AS modal_total,
    (((v.harga_jual - v.modal_bahan) - COALESCE(k.modal_kemasan, (0)::numeric)) - ((COALESCE((v.jumlah_pcs)::integer, 0))::numeric * p.upah_per_pcs)) AS margin,
    COALESCE(k.kemasan, '[]'::jsonb) AS kemasan
   FROM ((public.variants v
     JOIN public.products p ON ((p.id = v.product_id)))
     LEFT JOIN LATERAL ( SELECT sum((pk.harga_satuan * (vp.jumlah)::numeric)) AS modal_kemasan,
            jsonb_agg(jsonb_build_object('packaging_id', vp.packaging_id, 'jumlah', vp.jumlah) ORDER BY pk.nama) AS kemasan
           FROM (public.variant_packagings vp
             JOIN public.packagings pk ON ((pk.id = vp.packaging_id)))
          WHERE (vp.variant_id = v.id)) k ON (true));
GRANT SELECT ON public.v_hpp_varian TO authenticated;
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.v_hpp_varian TO service_role;
CREATE VIEW public.v_penjualan_item WITH (security_invoker=true) AS SELECT ti.id,
    ti.transaksi_id,
    t.created_at,
    t.status,
    t.kasir_id,
    t.kasir_nama,
    COALESCE(c.nama, '-'::text) AS nama_kategori,
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
    COALESCE(x.extra_harga, (0)::numeric) AS extra_harga_satuan,
    COALESCE(x.extra_modal, (0)::numeric) AS extra_modal_satuan,
    COALESCE(x.daftar, '-'::text) AS daftar_extra,
    (COALESCE(x.jumlah, (0)::bigint) > 0) AS pakai_extra,
    (ti.modal_bahan_satuan * (ti.qty)::numeric) AS modal_bahan,
    (ti.modal_kemasan_satuan * (ti.qty)::numeric) AS modal_kemasan,
    (ti.modal_upah_satuan * (ti.qty)::numeric) AS modal_upah,
    (COALESCE(x.extra_modal, (0)::numeric) * (ti.qty)::numeric) AS modal_extra,
    (COALESCE((ti.jumlah_pcs)::integer, 0) * ti.qty) AS pcs,
    ((ti.harga_satuan + COALESCE(x.extra_harga, (0)::numeric)) * (ti.qty)::numeric) AS omzet,
    ((ti.hpp_satuan + COALESCE(x.extra_modal, (0)::numeric)) * (ti.qty)::numeric) AS modal,
    ((((ti.harga_satuan + COALESCE(x.extra_harga, (0)::numeric)) - ti.hpp_satuan) - COALESCE(x.extra_modal, (0)::numeric)) * (ti.qty)::numeric) AS laba
   FROM (((((public.transaksi_item ti
     JOIN public.transaksi t ON ((t.id = ti.transaksi_id)))
     LEFT JOIN public.variants vv ON ((vv.id = ti.variant_id)))
     LEFT JOIN public.products p ON ((p.id = vv.product_id)))
     LEFT JOIN public.categories c ON ((c.id = p.category_id)))
     LEFT JOIN LATERAL ( SELECT sum(tim.tambahan_harga) AS extra_harga,
            sum(tim.tambahan_modal) AS extra_modal,
            count(*) AS jumlah,
            string_agg(tim.nama, ', '::text ORDER BY tim.nama) AS daftar
           FROM public.transaksi_item_modifier tim
          WHERE (tim.transaksi_item_id = ti.id)) x ON (true));
GRANT SELECT ON public.v_penjualan_item TO authenticated;
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.v_penjualan_item TO service_role;
