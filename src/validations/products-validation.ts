import { z } from "zod";

import { currencyField } from "@/validations/shared-validation";

/**
 * Sumber kebenaran validasi produk, dipakai `TriggerSheet` di browser dan
 * Server Action di server. Batas 50 karakter disamakan dengan
 * `categorySchema`; kolomnya sendiri cuma `text not null`, jadi batas itu
 * memang hanya ada di kode.
 */
export const productSchema = z.object({
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
});

/** Isi form apa adanya; `<Input type="number">` selalu mengembalikan string. */
export type ProductFormValues = z.input<typeof productSchema>;

/** Hasil setelah transform — ini yang dikirim ke database. */
export type ProductInput = z.output<typeof productSchema>;
