export default function ProductsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Daftar Produk</h1>
        <p className="text-sm text-muted-foreground">
          Produk induk yang bernaung di bawah satu kategori. Harga dan modalnya
          ada di varian, bukan di sini.
        </p>
      </div>
      <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed">
        <span className="text-sm text-muted-foreground">
          Daftar produk belum dibuat.
        </span>
      </div>
    </div>
  );
}
