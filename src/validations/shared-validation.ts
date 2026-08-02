import { z } from "zod";

/**
 * Schema pieces shared by more than one table. Not a table schema like its
 * neighbors in this folder — the name is deliberately "shared" so the
 * difference is visible at a glance.
 */

/** `numeric(12,2)` limit; matches the column, not a made-up number. */
const MAX_MONEY = 9_999_999_999.99;

/**
 * Money field from form input. Used by `variants.harga_jual`,
 * `variants.modal_bahan`, and `packagings.harga_satuan` — all three are
 * defined identically in the database: `numeric(12,2) not null default 0
 * check (>= 0)`.
 *
 * Accepts a string OR a number, and that is a requirement, not a nicety.
 * Schemas using it are validated twice over data that differs in shape:
 *   1. in the browser, over form contents       — still a string "15000" from `<Input>`
 *   2. in the Server Action, over the first parse result — already the number 15000
 * If only strings were accepted, `safeParse` on the server would reject the
 * very payload it produced itself.
 *
 * `label` goes into every message so a form with several money fields still
 * says which field is wrong.
 */
export function currencyField(label: string) {
  return z
    .union([z.string().trim(), z.number()])
    .refine((value) => value !== "", `${label} wajib diisi.`)
    // Rounded to two decimals here. Otherwise Postgres rounds silently and the
    // stored value differs from what the cashier typed.
    .transform((value) => Math.round(Number(value) * 100) / 100)
    // Number("abc") is NaN, and NaN passes all comparisons below — so filter it
    // out first.
    .refine(Number.isFinite, `${label} harus berupa angka.`)
    .refine((angka) => angka >= 0, `${label} tidak boleh negatif.`)
    .refine((angka) => angka <= MAX_MONEY, `${label} terlalu besar.`);
}
