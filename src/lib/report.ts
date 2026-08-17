import type { BarisLaporan } from "@/types/laporan";

/**
 * Baris RPC dipecah per kasir; untuk melihat varian mana yang paling laku,
 * baris-baris dengan produk dan varian yang sama digabung kembali.
 */
export function jumlahkanPerVarian(rows: BarisLaporan[]) {
  const peta = new Map<string, BarisLaporan>();

  for (const row of rows) {
    const key = `${row.nama_produk}|${row.nama_varian}`;
    const ada = peta.get(key);

    if (ada) {
      ada.porsi += row.porsi;
      ada.pcs += row.pcs;
      ada.omzet += row.omzet;
      ada.modal_bahan += row.modal_bahan;
      ada.modal_kemasan += row.modal_kemasan;
      ada.modal_upah += row.modal_upah;
      ada.modal_extra += row.modal_extra;
      ada.modal += row.modal;
      ada.laba += row.laba;
    } else {
      peta.set(key, { ...row });
    }
  }

  return [...peta.values()].sort((a, b) => b.omzet - a.omzet);
}
