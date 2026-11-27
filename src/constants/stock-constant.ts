import { hariIni } from "@/constants/cashflow-constant";
import type { SelectOption } from "@/types/form";
import type { JenisMutasiStok } from "@/types/stock";
import type { StockHistoryFormValues } from "@/validations/stock-validation";

export const STOCK_HISTORY_KEY = ["riwayat_stok"];

export const JENIS_MUTASI_OPTIONS: SelectOption<JenisMutasiStok>[] = [
  { value: "masuk", label: "Tambah stok (+)" },
  { value: "keluar", label: "Kurangi stok (−)" },
];

export function stockHistoryDefaults(
  productId = "",
): StockHistoryFormValues {
  return {
    product_id: productId,
    jenis: "masuk",
    jumlah_pcs: "",
    catatan: "",
    tanggal: hariIni(),
  };
}
