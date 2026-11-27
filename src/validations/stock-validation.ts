import { z } from "zod";

const MAX_INT = 2_147_483_647;

/**
 * Validasi input mutasi stok manual.
 *
 * `jumlah_pcs` dan `catatan` menerima string maupun hasil transform (number / null)
 * karena skema ini dipakai dua kali: oleh react-hook-form di browser dan
 * `safeParse` di Server Action.
 */
export const stockHistorySchema = z
  .object({
    product_id: z.uuid("Produk wajib dipilih."),
    jenis: z.enum(["masuk", "keluar"], "Jenis mutasi wajib dipilih."),
    jumlah_pcs: z.union([z.string().trim(), z.number()]),
    catatan: z
      .union([
        z.string().trim().max(200, "Catatan maksimal 200 karakter."),
        z.null(),
      ])
      .transform((teks) => (teks === "" ? null : teks)),
    tanggal: z
      .string()
      .trim()
      .min(1, "Tanggal wajib diisi.")
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tidak dikenali."),
  })
  .transform((data, ctx) => {
    let valid = true;
    const angka = Number(data.jumlah_pcs);

    if (data.jumlah_pcs === "") {
      ctx.addIssue({
        code: "custom",
        path: ["jumlah_pcs"],
        message: "Jumlah pcs wajib diisi.",
      });
      valid = false;
    } else if (!Number.isInteger(angka) || angka < 1 || angka > MAX_INT) {
      ctx.addIssue({
        code: "custom",
        path: ["jumlah_pcs"],
        message: `Jumlah pcs harus bilangan bulat 1–${MAX_INT}.`,
      });
      valid = false;
    }

    if (data.jenis === "keluar" && data.catatan === null) {
      ctx.addIssue({
        code: "custom",
        path: ["catatan"],
        message: "Catatan wajib diisi saat mengurangi stok.",
      });
      valid = false;
    }

    if (!valid) return z.NEVER;

    return { ...data, jumlah_pcs: angka };
  });

export type StockHistoryFormValues = z.input<typeof stockHistorySchema>;

export type StockHistoryInput = z.output<typeof stockHistorySchema>;
