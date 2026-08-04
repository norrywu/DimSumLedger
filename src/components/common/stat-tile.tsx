import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";

/**
 * Satu angka besar berlabel, untuk baris ringkasan di dasbor dan laporan.
 * Pakai ini untuk semua kartu angka, jangan rakit ulang Card + CardContent.
 *
 * `keterangan` menerima ReactNode, bukan string: rincian yang menjumlah ke
 * angka utama perlu dibaca berkolom, dan satu baris panjang dipisah titik
 * tengah tidak bisa dibandingkan dengan mata.
 */
export function StatTile({
  label,
  nilai,
  keterangan,
}: {
  label: string;
  nilai: string;
  keterangan?: ReactNode;
}) {
  return (
    <Card>
      <CardContent className="grid gap-1 py-4">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-2xl font-semibold tabular-nums">{nilai}</span>
        {keterangan && (
          <span className="text-xs text-muted-foreground">{keterangan}</span>
        )}
      </CardContent>
    </Card>
  );
}
