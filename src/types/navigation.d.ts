import type { LucideIcon } from "lucide-react";
import type { UserRole } from "@/types/auth";

/** Anak menu di dalam grup. Tanpa ikon — dirender sebagai teks saja. */
type NavSubItem = {
  title: string;
  url: string;
};

/** Bagian yang sama di kedua bentuk menu tingkat atas. */
type NavItemBase = {
  title: string;
  /** Komponen ikon lucide, bukan elemen — `nav-main` merendernya sebagai
   *  `<item.icon />` supaya styling ikon diatur di satu tempat. */
  icon: LucideIcon;
};

/** Menu satu tingkat. Diklik = pindah halaman. */
type NavLink = NavItemBase & {
  url: string;
  items?: never;
};

/** Menu bergrup. Diklik = buka/tutup daftar anaknya, TIDAK pindah halaman. */
type NavGroup = NavItemBase & {
  items: NavSubItem[];
  url?: never;
};

/**
 * `nav-main` membedakan keduanya lewat penyempitan `if (!item.items)`.
 *
 * `?: never` di masing-masing cabang wajib, bukan hiasan. Union saja tidak
 * cukup: excess property check TypeScript melonggar pada union, sehingga objek
 * yang membawa `url` DAN `items` sekaligus lolos begitu saja — `url` dikenal
 * NavLink, `items` dikenal NavGroup, jadi tidak ada properti yang benar-benar
 * asing. Sudah diuji. Dengan `?: never` kedua cabang gagal, dan kombinasi itu
 * ditolak seperti yang diharapkan.
 */
export type NavItem = NavLink | NavGroup;

/** Record, bukan objek biasa: menambah role baru di `UserRole` akan langsung
 *  menimbulkan error di sini kalau menunya lupa dibuat. */
export type NavItemsByRole = Record<UserRole, NavItem[]>;
