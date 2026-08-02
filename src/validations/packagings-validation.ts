import { z } from "zod";

import { currencyField } from "@/validations/shared-validation";

/**
 * Sumber kebenaran validasi kemasan, dipakai `TriggerSheet` di browser dan
 * Server Action di server.
 *
 * Seperti `variantSchema`, skema ini MENGUBAH tipe — `harga_satuan` masuk
 * sebagai string dari `<Input type="number">` dan keluar sebagai number. Karena
 * itu `z.input` dan `z.output` di bawah tidak sama, dan `TriggerSheet` harus
 * dipanggil dengan dua parameter tipe.
 */
export const packagingSchema = z.object({
  // Batas 50 karakter disamakan dengan `categorySchema`; kolomnya sendiri cuma
  // `text not null`, jadi batas itu memang hanya ada di kode.
  nama: z
    .string()
    .trim()
    .min(1, "Nama kemasan wajib diisi.")
    .max(50, "Nama kemasan maksimal 50 karakter."),
  // Wajib diisi meski kolomnya `default 0`. Kemasan berharga nol yang tidak
  // disengaja merusak perhitungan modal varian tanpa gejala apa pun — lebih
  // baik ditolak di form daripada diam-diam dianggap gratis.
  harga_satuan: currencyField("Harga satuan"),
});

/** Nilai yang dipegang form — harga masih string karena datang dari `<Input>`. */
export type PackagingFormValues = z.input<typeof packagingSchema>;

/** Hasil validasi, sudah jadi angka dan siap dikirim ke database. */
export type PackagingInput = z.output<typeof packagingSchema>;
