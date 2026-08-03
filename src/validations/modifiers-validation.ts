import { z } from "zod";

import { currencyField } from "@/validations/shared-validation";

export const modifierSchema = z.object({
  nama: z
    .string()
    .trim()
    .min(1, "Nama extra wajib diisi.")
    .max(50, "Nama extra maksimal 50 karakter."),
  tambahan_harga: currencyField("Tambahan harga"),
  tambahan_modal: currencyField("Tambahan modal"),
});

export type ModifierFormValues = z.input<typeof modifierSchema>;

export type ModifierInput = z.output<typeof modifierSchema>;
