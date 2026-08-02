import { PackagingsTable } from "./_components/packagings-table";

export default function PackagingsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Kemasan</h1>
        <p className="text-sm text-muted-foreground">
          Daftar kemasan beserta harga satuannya. Dipakai bersama lintas produk
          — modal kemasan tiap varian dihitung dari sini.
        </p>
      </div>
      <PackagingsTable />
    </div>
  );
}
