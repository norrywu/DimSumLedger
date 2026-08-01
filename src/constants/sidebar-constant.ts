import {
  LayoutDashboard,
  Package,
  Receipt,
  ShoppingCart,
  Users,
} from "lucide-react";

import type { NavItemsByRole } from "@/types/navigation";

/**
 * Menu sidebar per role. Hanya menyembunyikan tautan, BUKAN kontrol akses —
 * `src/lib/supabase/proxy.ts` masih memeriksa "sudah login atau belum" saja,
 * jadi kasir yang mengetik URL /APP/admin/* secara manual tetap masuk.
 *
 * Dua bentuk item, dibedakan oleh ada-tidaknya `items`:
 * - punya `url`, tanpa `items` → link biasa, diklik pindah halaman.
 * - punya `items`, tanpa `url` → tombol pelipat; seluruh barisnya membuka
 *   daftar anak dan tidak pernah memindahkan halaman. Menaruh `url` di sini
 *   ditolak TypeScript karena `NavGroup` memang tidak punya field itu.
 *
 * Sub-item tidak punya ikon — `NavSubItem` sengaja cuma { title, url } dan
 * `nav-main` merendernya sebagai teks di dalam SidebarMenuSub.
 *
 * Dari semua URL di bawah, baru `/APP/admin/dashboard` yang halamannya ada;
 * sisanya kerangka dan akan 404 sampai dibuat.
 */
export const navItems: NavItemsByRole = {
  admin: [
    { title: "Dasbor", url: "/APP/admin/dashboard", icon: LayoutDashboard },
    {
      title: "Produk",
      icon: Package,
      items: [
        { title: "Daftar Produk", url: "/APP/admin/products" },
        { title: "Kategori", url: "/APP/admin/categories" },
      ],
    },
    {
      title: "Transaksi",
      icon: Receipt,
      items: [
        { title: "Riwayat Transaksi", url: "/APP/admin/transactions" },
        { title: "Laporan Penjualan", url: "/APP/admin/reports" },
      ],
    },
    { title: "Pengguna", url: "/APP/admin/users", icon: Users },
  ],
  cashier: [
    { title: "Dasbor", url: "/APP/cashier/dashboard", icon: LayoutDashboard },
    // Layar kerja utama kasir — sengaja tidak bergrup supaya selalu satu klik.
    { title: "Kasir", url: "/APP/cashier/order", icon: ShoppingCart },
    {
      title: "Transaksi",
      icon: Receipt,
      items: [
        { title: "Riwayat", url: "/APP/cashier/transactions" },
        { title: "Shift Saya", url: "/APP/cashier/shifts" },
      ],
    },
  ],
};
