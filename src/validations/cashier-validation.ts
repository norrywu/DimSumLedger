import { z } from "zod";

const MAX_SMALLINT = 32767;

export const transaksiSchema = z.object({
  items: z
    .array(
      z.object({
        variant_id: z.uuid("Varian tidak dikenali."),
        qty: z
          .number()
          .int("Jumlah porsi harus bilangan bulat.")
          .min(1, "Jumlah porsi minimal 1.")
          .max(MAX_SMALLINT, `Jumlah porsi maksimal ${MAX_SMALLINT}.`),
        extra: z.array(z.uuid("Extra tidak dikenali.")),
      }),
    )
    .min(1, "Keranjang masih kosong."),
});

export type TransaksiInput = z.infer<typeof transaksiSchema>;
