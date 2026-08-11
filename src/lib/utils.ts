import { clsx, type ClassValue } from "clsx";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number as Indonesian Rupiah. Fractions are rounded since there is
 * no physical sen coinage — the `numeric(12,2)` column keeps the full value.
 */
export function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  })
    .format(value)
    .replace(/\u00a0/g, " ");
}

/**
 * Timestamp dari database untuk ditampilkan di tabel.
 *
 * `null` jadi em dash, bukan tanggal epoch: kolom seperti `last_sign_in_at`
 * kosong artinya "belum pernah", dan "1 Jan 1970" terbaca seolah itu kejadian
 * sungguhan.
 */
export function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";

  return format(new Date(value), "d MMM yyyy, HH:mm", { locale: idLocale });
}

export function getInitials(name: string | null | undefined) {
  return (name ?? "")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
