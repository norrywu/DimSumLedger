import "server-only";

import { redirect } from "next/navigation";

import { getAuthUser } from "@/servers/auth";
import type { AuthUser, UserRole } from "@/types/auth";
import { BERANDA_KASIR } from "./supabase/proxy";

export const MANAGER_ROLES: readonly UserRole[] = ["owner", "admin"];

export function isManagerRole(role: string | null | undefined): boolean {
  return MANAGER_ROLES.includes(role as UserRole);
}

export async function getManager(): Promise<AuthUser | null> {
  const user = await getAuthUser();

  // Role dibaca dari klaim `app_metadata` (lihat `getAuthUser`), yang hanya
  // bisa ditulis service role lewat trigger `internal.sync_profile_to_auth`.
  // `user_metadata` tidak bisa dipakai di sini: pengguna boleh mengubahnya
  // sendiri lewat `supabase.auth.updateUser()`.
  if (!isManagerRole(user?.role)) return null;

  return user;
}

/**
 * Versi halaman dari `getManager()`: memantulkan, bukan mengembalikan `null`.
 *
 * Dua tujuan pantulan yang berbeda disengaja. Belum login → halaman login.
 * Sudah login tapi kasir → beranda kasir, karena melempar orang yang JELAS
 * sudah masuk ke form login hanya bikin dia mengira sesinya putus.
 *
 * Ini lapisan pengalaman, bukan batas keamanan. Batas sesungguhnya ada di RLS:
 * seandainya halaman ini lolos dirender, tiap query di dalamnya tetap kosong
 * atau ditolak database.
 */
export async function requireManager(): Promise<AuthUser> {
  const user = await getAuthUser();

  if (!user) redirect("/auth/login");
  if (!isManagerRole(user.role)) redirect(BERANDA_KASIR);

  return user;
}
