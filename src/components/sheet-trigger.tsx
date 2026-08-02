"use client";

import { useEffect, type ComponentProps } from "react";
import {
  useForm,
  type DefaultValues,
  type FieldValues,
  type Path,
  type Resolver,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ZodType } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { FormField } from "@/components/common/form";
import { Spinner } from "@/components/ui/spinner";
import type { SelectOption } from "@/types/form";

export type SheetField<T extends FieldValues> = {
  name: Path<T>;
  label: string;
  type?: ComponentProps<typeof Input>["type"] | "select" | "switch";
  placeholder?: string;
  autoComplete?: string;
  /** Pilihan dropdown; hanya dipakai bila type === "select". */
  options?: SelectOption[];
};

/**
 * Dua parameter tipe, bukan satu, karena nilai yang DIPEGANG form belum tentu
 * sama dengan nilai yang KELUAR dari validasi. `<Input type="number">` selalu
 * mengembalikan string, sedangkan yang dikirim ke database harus number — jadi
 * skema seperti `variantSchema` mengubah tipenya di tengah jalan.
 *
 * - `TIn`  — isi form apa adanya; ini yang dipakai `defaultValues` dan `fields`.
 * - `TOut` — hasil zod setelah transform; ini yang diterima `onSubmit`.
 *
 * `TOut` default ke `TIn` supaya form yang tidak mengubah tipe (kategori,
 * produk) cukup menulis satu parameter seperti sebelumnya.
 */
export function TriggerSheet<
  TIn extends FieldValues,
  TOut extends FieldValues = TIn,
>({
  open,
  onOpenChange,
  fields,
  sheetTitle,
  sheetDescription = "Make changes here. Click save when you're done.",
  defaultValues,
  schema,
  onSubmit,
  submitLabel = "Save changes",
  isPending,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  fields: SheetField<TIn>[];
  sheetTitle: string;
  sheetDescription?: string;
  defaultValues: DefaultValues<TIn>;
  /** Urutan generic zod v4 adalah <Output, Input> — bukan kebalikannya. */
  schema: ZodType<TOut, TIn>;
  onSubmit?: (data: TOut) => void;
  submitLabel?: string;
  isPending?: boolean;
}) {
  // Parameter ketiga `useForm` adalah tipe hasil transform; itu yang bikin
  // `handleSubmit` menyerahkan angka ke `onSubmit`, bukan string mentah.
  const form = useForm<TIn, unknown, TOut>({
    resolver: zodResolver(schema as never) as Resolver<TIn, unknown, TOut>,
    defaultValues,
  });

  // RHF cuma membaca defaultValues saat mount, sedangkan komponen ini tidak
  // pernah ter-unmount — yang ditutup Radix hanya SheetContent. Tanpa reset
  // ini, sheet yang dibuka ulang masih memuat isian lama (mis. "Catat
  // Transaksi" kedua kali masih berisi nilai transaksi sebelumnya).
  useEffect(() => {
    if (open) form.reset(defaultValues);
    // defaultValues sengaja di luar deps: parent merakit objek baru tiap
    // render, jadi kalau ikut masuk, effect ini jalan tanpa henti.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSubmit = onSubmit
    ? form.handleSubmit(onSubmit)
    : (event: React.FormEvent) => event.preventDefault();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <SheetHeader>
            <SheetTitle>{sheetTitle}</SheetTitle>
            <SheetDescription>{sheetDescription}</SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 px-4 py-6">
            {fields.map((field) => (
              <FormField
                key={field.name}
                control={form.control}
                name={field.name}
                label={field.label}
                type={field.type}
                placeholder={field.placeholder}
                autoComplete={field.autoComplete}
                options={field.options}
              />
            ))}
          </div>
          <SheetFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Spinner data-icon="inline-start" />}
              {submitLabel}
            </Button>
            <SheetClose asChild>
              <Button type="button" variant="outline">
                Close
              </Button>
            </SheetClose>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
