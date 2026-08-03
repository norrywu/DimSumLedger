import { z } from "zod";

import { currencyField } from "@/validations/shared-validation";

const MAX_SMALLINT = 32767;

export const variantSchema = z
  .object({
    product_id: z.uuid("Produk wajib dipilih."),

    nama: z
      .string()
      .trim()
      .min(1, "Nama varian wajib diisi.")
      .max(50, "Nama varian maksimal 50 karakter."),

    jumlah_pcs: z
      .union([z.string().trim(), z.number(), z.null()])
      .transform((nilai) =>
        nilai === "" || nilai === null ? null : Number(nilai),
      )
      .refine(
        (angka) =>
          angka === null ||
          (Number.isInteger(angka) && angka > 0 && angka <= MAX_SMALLINT),
        `Jumlah pcs harus bilangan bulat 1–${MAX_SMALLINT}.`,
      ),
    harga_jual: currencyField("Harga jual"),
    modal_bahan: currencyField("Modal bahan"),
    aktif: z.boolean(),

    kemasan: z
      .array(
        z.object({
          packaging_id: z.uuid("Kemasan wajib dipilih."),

          jumlah: z
            .union([z.string().trim(), z.number()])
            .transform(Number)
            .refine(
              (angka) =>
                Number.isInteger(angka) && angka > 0 && angka <= MAX_SMALLINT,
              `Jumlah kemasan harus bilangan bulat 1–${MAX_SMALLINT}.`,
            ),
        }),
      )
      .min(1, "Varian wajib punya minimal satu kemasan."),
  })
  .refine((v) => !v.aktif || v.harga_jual > 0, {
    path: ["harga_jual"],
    message: "Varian aktif harus punya harga jual di atas 0.",
  });

export type VariantFormValues = z.input<typeof variantSchema>;

export type VariantInput = z.output<typeof variantSchema>;
