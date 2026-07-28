"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SelectOption } from "@/types/form";

/**
 * Sentinel internal untuk opsi "semua" — Radix Select tidak mengizinkan
 * value kosong, jadi undefined diwakili string ini di dalam komponen.
 * Dobel underscore supaya tidak bentrok dengan value opsi sungguhan.
 */
const ALL_VALUE = "__all__";

type FilterSelectProps<T extends string> = {
  /** undefined = tidak memfilter (opsi "semua" terpilih). */
  value: T | undefined;
  onChange: (value: T | undefined) => void;
  options: SelectOption<T>[];
  /** Label opsi pertama yang berarti "tanpa filter", mis. "Semua Kategori". */
  allLabel: string;
  ariaLabel: string;
  className?: string;
};

/**
 * Select untuk memfilter tabel/daftar: selalu punya opsi "semua" yang
 * dipetakan ke undefined. Pakai ini untuk semua filter dropdown, jangan
 * rakit ulang dari primitive ui/select.
 */
export function FilterSelect<T extends string>({
  value,
  onChange,
  options,
  allLabel,
  ariaLabel,
  className,
}: FilterSelectProps<T>) {
  return (
    <Select
      value={value ?? ALL_VALUE}
      onValueChange={(next) =>
        onChange(
          next === ALL_VALUE
            ? undefined
            : // Aman: item non-sentinel hanya dirender dari `options`.
              (next as T),
        )
      }
    >
      <SelectTrigger className={className} aria-label={ariaLabel}>
        <SelectValue placeholder={allLabel} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_VALUE}>{allLabel}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
