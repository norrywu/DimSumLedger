import { z } from "zod";

import { currencyField } from "@/validations/shared-validation";

export const cashFlowSchema = z.object({
  type: z.enum(["income", "expense"], "Jenis wajib dipilih."),

  // `currencyField` mengizinkan 0; kolomnya `check (amount > 0)`.
  amount: currencyField("Jumlah").refine(
    (angka) => angka > 0,
    "Jumlah harus lebih dari 0.",
  ),

  category: z
    .string()
    .trim()
    .min(1, "Kategori wajib diisi.")
    .max(50, "Kategori maksimal 50 karakter."),

  // Menerima string ATAU null, dan itu keharusan — bukan kelonggaran. Skema ini
  // dipakai dua kali atas data yang bentuknya berbeda: di browser masih "" dari
  // `<Input>`, di Server Action sudah null hasil transform di bawah. Kalau
  // hanya string yang diterima, `safeParse` di server menolak kiriman yang ia
  // hasilkan sendiri.
  description: z
    .union([
      z.string().trim().max(200, "Keterangan maksimal 200 karakter."),
      z.null(),
    ])
    .transform((teks) => (teks === "" ? null : teks)),

  transaction_date: z
    .string()
    .trim()
    .min(1, "Tanggal wajib diisi.")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tidak dikenali."),
});

export type CashFlowFormValues = z.input<typeof cashFlowSchema>;

export type CashFlowInput = z.output<typeof cashFlowSchema>;
