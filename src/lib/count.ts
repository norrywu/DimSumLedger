export function keAngka(nilai: string | number | null | undefined): number {
  const angka = Number(nilai ?? 0);

  return Number.isFinite(angka) ? angka : 0;
}

export function hitungHppVarian({
  hargaJual,
  modalBahan,
  kemasan,
}: {
  hargaJual: number;
  modalBahan: number;

  kemasan: { hargaSatuan: number; jumlah: number }[];
}) {
  const modalKemasan = kemasan.reduce(
    (jumlahnya, baris) => jumlahnya + baris.hargaSatuan * baris.jumlah,
    0,
  );
  const modalTotal = modalBahan + modalKemasan;

  return { modalKemasan, modalTotal, margin: hargaJual - modalTotal };
}
