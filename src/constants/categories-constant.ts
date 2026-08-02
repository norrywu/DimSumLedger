import type { SheetField } from "@/components/sheet-trigger";
import type { CategoryInput } from "@/validations/categories-validation";

/**
 * Query key react-query, dikumpulkan supaya komponen yang membaca dan yang
 * meng-invalidate memakai key yang sama persis. Kalau ditulis literal di dua
 * tempat, salah ketik satu huruf bikin tabel diam-diam tidak ikut segar
 * setelah simpan.
 */
export const CATEGORIES_KEY = ["categories"];

/**
 * Nilai awal sheet kategori saat mode "tambah". `TriggerSheet` mereset form ke
 * nilai ini tiap kali sheet dibuka, jadi tidak ada sisa isian dari kali
 * sebelumnya.
 *
 * Bertipe `CategoryInput` supaya kalau nanti ada field baru di
 * `categorySchema`, TypeScript langsung menuntut nilai awalnya ikut ditambah.
 */
export const CATEGORY_FORM_DEFAULTS: CategoryInput = { nama: "" };

/**
 * Isi sheet kategori. Konstanta seperti `PROFILE_FIELDS`, bukan fungsi seperti
 * `productFields` — tidak ada opsi dropdown yang perlu menunggu data dimuat.
 */
export const CATEGORY_FIELDS: SheetField<CategoryInput>[] = [
  { name: "nama", label: "Nama kategori", placeholder: "mis. Dimsum Kukus" },
];
