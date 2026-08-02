import { CategoriesTable } from "./_components/categories-table";

export default function CategoriesPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Kategori</h1>
        <p className="text-sm text-muted-foreground">
          Kelompok besar produk, mis. Dimsum Kukus, Minuman.
        </p>
      </div>

      <CategoriesTable />
    </div>
  );
}
