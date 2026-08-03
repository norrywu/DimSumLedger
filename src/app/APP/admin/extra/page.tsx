import { ModifiersTable } from "./_components/modifiers-table";

export default function ExtraPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Extra</h1>
        <p className="text-sm text-muted-foreground">
          Tambahan berbayar yang bisa dipilih kasir saat mencatat pesanan —
          harganya ditambahkan ke item, terpisah dari harga varian.
        </p>
      </div>
      <ModifiersTable />
    </div>
  );
}
