import type { SheetField } from "@/components/sheet-trigger";
import type { PackagingFormValues } from "@/validations/packagings-validation";

/**
 * Query key react-query, dikumpulkan supaya komponen yang membaca dan yang
 * meng-invalidate memakai key yang sama persis. Kalau ditulis literal di dua
 * tempat, salah ketik satu huruf bikin tabel diam-diam tidak ikut segar setelah
 * simpan atau hapus.
 */
export const PACKAGINGS_KEY = ["packagings"];

/**
 * Nilai awal sheet tambah kemasan. `TriggerSheet` mereset form ke nilai ini
 * tiap kali sheet dibuka, jadi tidak ada sisa isian dari kali sebelumnya.
 *
 * Bertipe `PackagingFormValues` (sisi masukan), bukan `PackagingInput` (sisi
 * keluaran): harga masih string kosong karena itulah yang dipegang `<Input
 * type="number">` sebelum disentuh.
 */
export const PACKAGING_FORM_DEFAULTS: PackagingFormValues = {
  nama: "",
  harga_satuan: "",
};

/**
 * Isi sheet kemasan. Konstanta seperti `CATEGORY_FIELDS`, bukan fungsi seperti
 * `variantFields` atau `productFields` — tidak ada opsi dropdown yang perlu
 * menunggu data dimuat.
 */
export const PACKAGING_FIELDS: SheetField<PackagingFormValues>[] = [
  { name: "nama", label: "Nama kemasan", placeholder: "mis. Mika 10" },
  {
    name: "harga_satuan",
    label: "Harga satuan",
    type: "number",
    placeholder: "mis. 1500",
  },
];
