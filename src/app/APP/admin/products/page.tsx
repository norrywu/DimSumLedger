import { ProductsTable } from "./_components/products-table";

export default function ProductsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Daftar Produk</h1>
        <p className="text-sm text-muted-foreground">
          Produk induk yang bernaung di bawah satu kategori, termasuk tarif upah
          dan stok dalam satuan pcs. Harga dan modal per porsi ada di varian.
        </p>
      </div>
      <ProductsTable />
    </div>
  );
}
