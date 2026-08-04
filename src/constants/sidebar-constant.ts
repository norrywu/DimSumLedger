import {
  LayoutDashboard,
  Package,
  Receipt,
  ShoppingCart,
  Users,
  Wallet,
} from "lucide-react";

import type { NavItem, NavItemsByRole } from "@/types/navigation";

const managerMenu: NavItem[] = [
  { title: "Dasbor", url: "/APP/admin/dashboard", icon: LayoutDashboard },
  {
    title: "Produk",
    icon: Package,
    items: [
      { title: "Daftar Produk", url: "/APP/admin/products" },
      { title: "Varian", url: "/APP/admin/variants" },

      { title: "Kategori", url: "/APP/admin/categories" },
      { title: "Kemasan", url: "/APP/admin/packagings" },
      { title: "Extra", url: "/APP/admin/extra" },
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
  { title: "Arus Kas", url: "/APP/admin/cashflow", icon: Wallet },
  { title: "Pengguna", url: "/APP/admin/users", icon: Users },
];

export const navItems: NavItemsByRole = {
  owner: managerMenu,
  admin: managerMenu,
  cashier: [
    // Layar kerja utama kasir — sengaja tidak bergrup supaya selalu satu klik.
    { title: "Kasir", url: "/APP/cashier/order", icon: ShoppingCart },
    {
      title: "Transaksi",
      icon: Receipt,
      items: [{ title: "Riwayat", url: "/APP/cashier/transactions" }],
    },
  ],
};
