import {
  LayoutDashboard,
  Package,
  Receipt,
  ShoppingCart,
  Users,
  Wallet,
} from "lucide-react";

import type { NavItem, NavItemsByRole } from "@/types/navigation";

const dasbor: NavItem = {
  title: "Dasbor",
  url: "/APP/admin/dashboard",
  icon: LayoutDashboard,
};

const produk: NavItem = {
  title: "Produk",
  icon: Package,
  items: [
    { title: "Daftar Produk", url: "/APP/admin/products" },
    { title: "Varian", url: "/APP/admin/variants" },

    { title: "Kategori", url: "/APP/admin/categories" },
    { title: "Kemasan", url: "/APP/admin/packagings" },
    { title: "Extra", url: "/APP/admin/extra" },
  ],
};

const transaksi: NavItem = {
  title: "Transaksi",
  icon: Receipt,
  items: [
    { title: "Riwayat Transaksi", url: "/APP/admin/transactions" },
    { title: "Laporan Penjualan", url: "/APP/admin/reports" },
    { title: "Kasir", url: "/APP/cashier/order" },
  ],
};

const arusKas: NavItem = {
  title: "Arus Kas",
  url: "/APP/admin/cashflow",
  icon: Wallet,
};

const pengguna: NavItem = {
  title: "Pengguna",
  url: "/APP/admin/users",
  icon: Users,
};

// Layar kerja utama kasir — sengaja tidak bergrup supaya selalu satu klik.
const kasirOrder: NavItem = {
  title: "Kasir",
  url: "/APP/cashier/order",
  icon: ShoppingCart,
};

const transaksiKasir: NavItem = {
  title: "Transaksi",
  icon: Receipt,
  items: [{ title: "Riwayat", url: "/APP/cashier/transactions" }],
};

const ownerMenu: NavItem[] = [dasbor, transaksi, arusKas];

const managerMenu: NavItem[] = [dasbor, produk, transaksi, arusKas, pengguna];

export const navItems: NavItemsByRole = {
  owner: ownerMenu,
  admin: managerMenu,
  cashier: [kasirOrder, transaksiKasir],
};