import type { SelectOption } from "@/types/form";
import type { PeriodeLaporan } from "@/types/laporan";

export const LAPORAN_KEY = ["laporan_penjualan"];

export const PERIODE_OPTIONS: SelectOption<PeriodeLaporan>[] = [
  { value: "hari_ini", label: "Hari ini" },
  { value: "7_hari", label: "7 hari terakhir" },
  { value: "30_hari", label: "30 hari terakhir" },
];

/** Berapa hari ke belakang dihitung dari hari ini, termasuk hari ini. */
export const PERIODE_HARI: Record<PeriodeLaporan, number> = {
  hari_ini: 1,
  "7_hari": 7,
  "30_hari": 30,
};
