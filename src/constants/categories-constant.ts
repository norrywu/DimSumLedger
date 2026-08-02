import type { CategoryInput } from "@/validations/categories-validation";

/**
 * Query key react-query, dikumpulkan supaya komponen yang membaca dan yang
 * meng-invalidate memakai key yang sama persis. Kalau ditulis literal di dua
 * tempat, salah ketik satu huruf bikin tabel diam-diam tidak ikut segar
 * setelah simpan.
 */
export const CATEGORIES_KEY = ["categories"];

/**
 * Nilai awal form tambah kategori. Dipakai dua kali di `KategoriForm`: saat
 * `useForm` dibuat, dan saat `form.reset()` setelah simpan berhasil — jadi
 * keduanya dijamin memakai nilai yang sama.
 *
 * Bertipe `CategoryInput` supaya kalau nanti ada field baru di
 * `categorySchema`, TypeScript langsung menuntut nilai awalnya ikut ditambah.
 */
export const CATEGORY_FORM_DEFAULTS: CategoryInput = { nama: "" };
