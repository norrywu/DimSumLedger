
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
