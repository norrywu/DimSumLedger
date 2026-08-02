"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Tombol ikon tanpa teks yang menjelaskan dirinya lewat tooltip. Pakai ini
 * untuk semua aksi baris tabel, jangan rakit ulang Tooltip + Button.
 *
 * Satu `label` melayani tooltip DAN `aria-label` sekaligus: tombol ikon tidak
 * punya teks yang bisa dibaca screen reader, dan menyatukan keduanya di satu
 * prop bikin mustahil keduanya berbeda.
 *
 * `TooltipProvider` sudah terpasang di `src/app/APP/layout.tsx`, jadi komponen
 * ini tidak memasang provider sendiri.
 *
 * Catatan: saat `disabled`, tooltipnya tidak muncul. Tombol yang disabled
 * memang tidak memancarkan event pointer — itu perilaku Radix, bukan bug.
 */
export function IconActionButton({
  label,
  icon,
  onClick,
  disabled,
  className,
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          disabled={disabled}
          onClick={onClick}
          className={className}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
