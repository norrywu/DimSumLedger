import type { ReactNode } from "react";

import { requireManager } from "@/lib/auth-guard";

/**
 * Lapisan kedua setelah cek di `proxy.ts`, untuk pemuatan LANGSUNG ke URL
 * /APP/admin (ketik alamat, refresh, bookmark).
 *
 * Sengaja tidak berdiri sendiri: dokumen Next 16 memperingatkan bahwa layout
 * tidak dirender ulang saat berpindah rute, jadi kasir yang berpindah lewat
 * tautan client-side tidak melewati cek ini — itu bagian proxy.
 */
export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireManager();

  return <>{children}</>;
}
