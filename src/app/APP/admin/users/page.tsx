import { UsersTable } from "./_components/users-table";

export default function UsersPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Pengguna</h1>
        <p className="text-sm text-muted-foreground">
          Akun yang bisa masuk ke aplikasi ini. Kasir hanya melihat menu
          penjualan; pemilik dan admin melihat seluruh menu pengelolaan.
        </p>
      </div>
      <UsersTable />
    </div>
  );
}
