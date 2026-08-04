import { addDays, startOfDay, subDays } from "date-fns";

import { PERIODE_HARI } from "@/constants/laporan-constant";
import { createClient } from "@/lib/supabase/client";
import type { BarisLaporan, PeriodeLaporan } from "@/types/laporan";

/**
 * `sampai` selalu awal hari BESOK, bukan sekarang, supaya penjualan yang terjadi
 * beberapa menit setelah laporan dibuka tetap ikut terhitung tanpa perlu ganti
 * rentang. RPC-nya membandingkan dengan `<`, jadi batas itu tidak pernah ikut.
 *
 * `periode` undefined berarti "semua waktu" — itu opsi bawaan `FilterSelect`.
 */
function rentang(periode: PeriodeLaporan | undefined) {
  const sampai = startOfDay(addDays(new Date(), 1));

  if (!periode) {
    return { dari: new Date(0), sampai };
  }

  return {
    dari: startOfDay(subDays(new Date(), PERIODE_HARI[periode] - 1)),
    sampai,
  };
}

export async function getLaporanPenjualan(
  periode: PeriodeLaporan | undefined,
): Promise<BarisLaporan[]> {
  const supabase = createClient();
  const { dari, sampai } = rentang(periode);

  const { data, error } = await supabase.rpc("laporan_penjualan", {
    p_dari: dari.toISOString(),
    p_sampai: sampai.toISOString(),
  });

  if (error) {
    throw new Error(`Gagal memuat laporan: ${error.message}`);
  }

  return (data ?? []) as unknown as BarisLaporan[];
}
