export function keAngka(nilai: string | number | null | undefined): number {
  const angka = Number(nilai ?? 0);

  return Number.isFinite(angka) ? angka : 0;
}

export function hitungHppVarian({
  hargaJual,
  modalBahan,
  kemasan,
  jumlahPcs = 0,
  upahPerPcs = 0,
}: {
  hargaJual: number;
  modalBahan: number;

  kemasan: { hargaSatuan: number; jumlah: number }[];

  /** Keduanya opsional dan default 0: varian boleh belum punya jumlah pcs. */
  jumlahPcs?: number;
  upahPerPcs?: number;
}) {
  const modalKemasan = kemasan.reduce(
    (jumlahnya, baris) => jumlahnya + baris.hargaSatuan * baris.jumlah,
    0,
  );
  const modalUpah = jumlahPcs * upahPerPcs;
  const modalTotal = modalBahan + modalKemasan + modalUpah;

  return { modalKemasan, modalUpah, modalTotal, margin: hargaJual - modalTotal };
}

export function hitungKeranjang({
  items,
}: {
  items: {
    hargaSatuan: number;
    qty: number;
    extra: { tambahanHarga: number }[];
  }[];
}) {
  const total = items.reduce((jumlahnya, item) => {
    const tambahan = item.extra.reduce(
      (nilai, baris) => nilai + baris.tambahanHarga,
      0,
    );

    return jumlahnya + (item.hargaSatuan + tambahan) * item.qty;
  }, 0);

  return { total };
}

export function hitungKembalian({
  total,
  dibayar,
}: {
  total: number;
  dibayar: number;
}) {
  return {
    kembalian: Math.max(dibayar - total, 0),
    kurang: Math.max(total - dibayar, 0),
    cukup: dibayar >= total,
  };
}

export function hitungStokTerpakaiPerProduk(
  items: { product_id: string; jumlah_pcs: number | null; qty: number }[],
): Record<string, number> {
  return items.reduce<Record<string, number>>((akumulasi, item) => {
    const pcs = (item.jumlah_pcs ?? 0) * item.qty;
    akumulasi[item.product_id] = (akumulasi[item.product_id] ?? 0) + pcs;
    return akumulasi;
  }, {});
}

export function hitungSisaStokVarian({
  lacakStok,
  stokPcs,
  jumlahPcs,
  terpakaiPcs = 0,
}: {
  lacakStok: boolean;
  stokPcs: number;
  jumlahPcs: number | null;
  terpakaiPcs?: number;
}) {
  if (!lacakStok) {
    return {
      dibatasi: false as const,
      sisaPcs: null,
      maksTambahPorsi: Number.POSITIVE_INFINITY,
      habis: false,
      melebihiStok: false,
    };
  }

  const melebihiStok = terpakaiPcs > stokPcs;
  const sisaPcs = Math.max(stokPcs - terpakaiPcs, 0);

  if (!jumlahPcs || jumlahPcs <= 0) {
    return {
      dibatasi: true as const,
      sisaPcs,
      maksTambahPorsi: 0,
      habis: true,
      melebihiStok,
    };
  }

  const maksTambahPorsi = Math.floor(sisaPcs / jumlahPcs);

  return {
    dibatasi: true as const,
    sisaPcs,
    maksTambahPorsi,
    habis: maksTambahPorsi < 1,
    melebihiStok,
  };
}
