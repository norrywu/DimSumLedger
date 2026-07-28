"use client";

import type { MouseEvent } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

type TablePaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

/**
 * Nomor halaman yang ditampilkan: semua halaman bila sedikit; bila banyak,
 * selalu halaman 1 & terakhir + jendela di sekitar halaman aktif, dengan
 * "ellipsis" mengisi celah. Maksimal 7 item supaya tidak meluber di mobile.
 */
function getPageItems(page: number, totalPages: number): (number | "ellipsis")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const shown = [
    ...new Set(
      [1, page - 1, page, page + 1, totalPages].filter(
        (candidate) => candidate >= 1 && candidate <= totalPages,
      ),
    ),
  ].sort((a, b) => a - b);

  const items: (number | "ellipsis")[] = [];
  let previous = 0;
  for (const current of shown) {
    // Celah tepat satu halaman → tampilkan nomornya langsung;
    // ellipsis yang mewakili satu halaman cuma bikin klik ekstra.
    if (current - previous === 2) items.push(previous + 1);
    else if (current - previous > 2) items.push("ellipsis");
    items.push(current);
    previous = current;
  }
  return items;
}

/**
 * Pagination bernomor untuk tabel: prev/next + link nomor halaman + ellipsis.
 * Pakai ini untuk semua tabel ber-pagination, jangan rakit ulang dari
 * primitive ui/pagination. Clamping dilakukan di sini — caller cukup
 * meneruskan setter halamannya.
 */
export function TablePagination({
  page,
  totalPages,
  onPageChange,
}: TablePaginationProps) {
  const goTo = (target: number) => (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    if (target < 1 || target > totalPages || target === page) return;
    onPageChange(target);
  };

  const disabledClass = "pointer-events-none opacity-50";

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            aria-disabled={page <= 1}
            className={page <= 1 ? disabledClass : undefined}
            onClick={goTo(page - 1)}
          />
        </PaginationItem>
        {getPageItems(page, totalPages).map((item, index) => (
          <PaginationItem key={item === "ellipsis" ? `ellipsis-${index}` : item}>
            {item === "ellipsis" ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink
                href="#"
                isActive={item === page}
                aria-label={`Ke halaman ${item}`}
                onClick={goTo(item)}
              >
                {item}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext
            href="#"
            aria-disabled={page >= totalPages}
            className={page >= totalPages ? disabledClass : undefined}
            onClick={goTo(page + 1)}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
