import type { SheetField } from "@/components/sheet-trigger";
import type { SelectOption } from "@/types/form";
import type { CashFlowFormValues } from "@/validations/cashflow-validation";

export const CASHFLOW_KEY = ["cash_flow"];

/**
 * Fungsi, bukan konstanta: tanggal hari ini tidak boleh dibekukan saat modul
 * dimuat — server dan browser bisa memuatnya di hari yang berbeda.
 */
export function cashFlowDefaults(): CashFlowFormValues {
  return {
    type: "expense",
    amount: "",
    category: "",
    description: "",
    transaction_date: hariIni(),
  };
}

/** `YYYY-MM-DD` menurut jam LOKAL, bukan `toISOString()` yang memakai UTC. */
export function hariIni() {
  return tanggalKe(0);
}

export function tanggalKe(mundurHari: number) {
  const hasil = new Date();
  hasil.setDate(hasil.getDate() - mundurHari);

  const bulan = `${hasil.getMonth() + 1}`.padStart(2, "0");
  const tanggal = `${hasil.getDate()}`.padStart(2, "0");

  return `${hasil.getFullYear()}-${bulan}-${tanggal}`;
}

/**
 * Kategori dipilih, bukan diketik: teks bebas membuat "Listrik" dan "listrik"
 * jadi dua baris berbeda di laporan, dan tidak ada yang menyadarinya sampai
 * angkanya dijumlahkan.
 *
 * Dipisah per jenis karena "Gaji" tidak masuk akal sebagai pemasukan. Kalau
 * nanti perlu diubah pemilik toko sendiri, ini yang naik jadi tabel rujukan —
 * kolom `category` sengaja tetap teks supaya perpindahan itu tidak memaksa
 * migrasi data.
 */
const KATEGORI_PEMASUKAN: SelectOption[] = [
  { value: "Penjualan", label: "Penjualan" },
  { value: "Modal masuk", label: "Modal masuk" },
  { value: "Pengembalian", label: "Pengembalian" },
  { value: "Lain-lain", label: "Lain-lain" },
];

const KATEGORI_PENGELUARAN: SelectOption[] = [
  { value: "Bahan baku", label: "Bahan baku" },
  { value: "Kemasan", label: "Kemasan" },
  { value: "Gaji & upah", label: "Gaji & upah" },
  { value: "Listrik & air", label: "Listrik & air" },
  { value: "Sewa", label: "Sewa" },
  { value: "Transport", label: "Transport" },
  { value: "Peralatan", label: "Peralatan" },
  { value: "Lain-lain", label: "Lain-lain" },
];

export function kategoriUntuk(type: string | undefined) {
  return type === "income" ? KATEGORI_PEMASUKAN : KATEGORI_PENGELUARAN;
}

/**
 * `category` dan `description` tidak di sini melainkan di `children` milik
 * `TriggerSheet`: pilihan kategorinya bergantung pada nilai `type` yang sedang
 * dipilih, dan itu baru bisa dibaca dari dalam form.
 */
export const CASHFLOW_FIELDS: SheetField<CashFlowFormValues>[] = [
  {
    name: "type",
    label: "Jenis",
    type: "select",
    placeholder: "Pilih jenis",
    options: [
      { value: "expense", label: "Pengeluaran" },
      { value: "income", label: "Pemasukan" },
    ],
  },
  { name: "transaction_date", label: "Tanggal", type: "date" },
  { name: "amount", label: "Jumlah", type: "number", placeholder: "mis. 50000" },
];
