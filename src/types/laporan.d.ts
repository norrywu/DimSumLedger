export type PeriodeLaporan = "hari_ini" | "7_hari" | "30_hari";

export type BarisLaporan = {
  nama_produk: string;
  nama_varian: string;
  porsi: number;
  pcs: number;
  omzet: number;
  modal_bahan: number;
  modal_kemasan: number;
  modal_upah: number;
  modal_extra: number;
  modal: number;
  laba: number;
};
