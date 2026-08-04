"use client";

import { useQuery } from "@tanstack/react-query";

import { getLaporanPenjualan } from "@/clients/laporan";
import { LAPORAN_KEY } from "@/constants/laporan-constant";
import type { PeriodeLaporan } from "@/types/laporan";

export function useLaporanPenjualan(periode: PeriodeLaporan | undefined) {
  return useQuery({
    queryKey: [...LAPORAN_KEY, periode ?? "semua"],
    queryFn: () => getLaporanPenjualan(periode),
  });
}
