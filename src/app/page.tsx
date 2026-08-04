import { redirect } from "next/navigation";

import { isManagerRole } from "@/lib/auth-guard";
import { getAuthUser } from "@/servers/auth";

/**
 * Bukan halaman, melainkan persimpangan: `proxy.ts` sudah memantulkan yang
 * belum login, jadi siapa pun yang sampai di sini pasti punya sesi — dan
 * halaman pendaratan berisi tombol "Masuk" cuma membuatnya mengira sesinya
 * putus.
 */
export default async function Home() {
  const user = await getAuthUser();

  if (!user) redirect("/auth/login");

  redirect(
    isManagerRole(user.role) ? "/APP/admin/dashboard" : "/APP/cashier/order",
  );
}
