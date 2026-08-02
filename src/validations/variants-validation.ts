import { z } from "zod";

import { currencyField } from "@/validations/shared-validation";

/**
 * Sumber kebenaran validasi varian, dipakai `TriggerSheet` di browser dan
 * Server Action di server.
 *
 * Yang membedakannya dari `productSchema`: skema ini MENGUBAH tipe. `<Input
 * type="number">` selalu mengembalikan string, sedangkan kolomnya numerik —
 * jadi angka dikonversi di sini, dan `z.input` tidak sama dengan `z.output`.
 *
 * Konsekuensinya skemanya wajib idempoten, karena divalidasi dua kali atas data
 * yang bentuknya sudah berbeda:
 *   1. di browser, atas isi form   — `harga_jual` masih string "15000"
 *   2. di Server Action, atas hasil parse pertama — sudah number 15000
 * `currencyField()` sudah menangani itu untuk field uang; `jumlah_pcs` di bawah menerima
 * string, number, maupun null demi alasan yang sama.
 */

/** Batas `smallint`; lewat dari ini Postgres melempar 22003. */
const MAX_SMALLINT = 32767;

export const variantSchema = z.object({
  // Nilai awalnya string kosong karena Radix Select belum tersentuh, jadi pesan
  // bawaan soal format uuid diganti kalimat yang berarti bagi pengguna.
  product_id: z.uuid("Produk wajib dipilih."),
  // Batas 50 karakter disamakan dengan `productSchema`; kolomnya sendiri cuma
  // `text not null`, jadi batas itu memang hanya ada di kode.
  nama: z
    .string()
    .trim()
    .min(1, "Nama varian wajib diisi.")
    .max(50, "Nama varian maksimal 50 karakter."),
  // Kosong itu sah dan berarti NULL — "jumlah pcs belum diketahui", sesuai
  // komentar di skema tabelnya.
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
});

/** Nilai yang dipegang form — angka masih string karena datang dari `<Input>`. */
export type VariantFormValues = z.input<typeof variantSchema>;

/** Hasil validasi, sudah jadi angka dan siap dikirim ke database. */
export type VariantInput = z.output<typeof variantSchema>;
