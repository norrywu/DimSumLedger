import { z } from "zod";

import { currencyField } from "@/validations/shared-validation";

const MAX_INT = 2_147_483_647;

/**
 * Sumber kebenaran validasi produk, dipakai `TriggerSheet` di browser dan
 * Server Action di server. Batas 50 karakter disamakan dengan
 * `categorySchema`; kolomnya sendiri cuma `text not null`, jadi batas itu
 * memang hanya ada di kode.
 */
export const productSchema = z
  .object({
    nama: z
      .string()
      .trim()
      .min(1, "Nama produk wajib diisi.")
      .max(50, "Nama produk maksimal 50 karakter."),
    // Nilai awalnya string kosong karena Radix Select belum tersentuh, jadi
    // pesan bawaan soal format uuid diganti kalimat yang berarti bagi pengguna.
    category_id: z.uuid("Kategori wajib dipilih."),
    // Per POTONG, bukan per porsi — varian "isi 8" otomatis dua kali "isi 4".
    upah_per_pcs: currencyField("Upah per pcs"),
    lacak_stok: z.boolean(),
    stok_pcs: z.union([z.string().trim(), z.number()]),
  })
  .transform((data, ctx) => {
    if (!data.lacak_stok) {
      const angka = Number(data.stok_pcs);
      const aman =
        data.stok_pcs !== "" &&
        Number.isInteger(angka) &&
        angka >= 0 &&
        angka <= MAX_INT
          ? angka
          : 0;

      return { ...data, stok_pcs: aman };
    }

    if (data.stok_pcs === "") {
      ctx.addIssue({
        code: "custom",
        path: ["stok_pcs"],
        message: "Stok wajib diisi.",
      });
      return z.NEVER;
    }

    const angka = Number(data.stok_pcs);
    if (!Number.isInteger(angka) || angka < 0 || angka > MAX_INT) {
      ctx.addIssue({
        code: "custom",
        path: ["stok_pcs"],
        message: `Stok harus bilangan bulat 0–${MAX_INT}.`,
      });
      return z.NEVER;
    }

    return { ...data, stok_pcs: angka };
  });

/** Isi form apa adanya; `<Input type="number">` selalu mengembalikan string. */
export type ProductFormValues = z.input<typeof productSchema>;

/** Hasil setelah transform — ini yang dikirim ke database. */
export type ProductInput = z.output<typeof productSchema>;
