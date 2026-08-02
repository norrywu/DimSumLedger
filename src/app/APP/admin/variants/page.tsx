export default function VariantsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Varian</h1>
        <p className="text-sm text-muted-foreground">
          Barang yang benar-benar dijual — pembawa harga jual, modal bahan, dan
          kemasan.
        </p>
      </div>
      <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed">
        <span className="text-sm text-muted-foreground">
          Daftar varian belum dibuat.
        </span>
      </div>
    </div>
  );
}
