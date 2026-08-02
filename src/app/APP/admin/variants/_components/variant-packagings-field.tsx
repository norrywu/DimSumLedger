"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";
import { Controller, useFieldArray, useWatch, type UseFormReturn } from "react-hook-form";

import { IconActionButton } from "@/components/common/icon-action-button";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePackagings } from "@/hooks/use-packagings";
import { formatCurrency } from "@/lib/utils";
import type {
  VariantFormValues,
  VariantInput,
} from "@/validations/variants-validation";

type VariantForm = UseFormReturn<VariantFormValues, unknown, VariantInput>;

/**
 * Daftar kemasan varian — baris berulang, jadi tidak bisa dinyatakan sebagai
 * `SheetField`. Ia mengisi slot `children` milik `TriggerSheet`.
 *
 * Bukan sekadar isian tambahan: ini yang membuat modal varian utuh. Tanpa
 * kemasan, `modal_kemasan` terbaca 0 dan margin tampak lebih besar dari yang
 * sebenarnya — karena itu `variantSchema` dan `public.simpan_varian` sama-sama
 * menuntut minimal satu baris.
 */
export function VariantPackagingsField({ form }: { form: VariantForm }) {
  const { data: packagings } = usePackagings();

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "kemasan",
  });

  // `useWatch`, bukan `form.getValues()`: yang terakhir tidak memicu render,
  // jadi ringkasan biaya di bawah tidak akan ikut bergerak saat diketik.
  const kemasan = useWatch({ control: form.control, name: "kemasan" });
  const hargaJual = useWatch({ control: form.control, name: "harga_jual" });
  const modalBahan = useWatch({ control: form.control, name: "modal_bahan" });

  const hargaKemasan = (packagingId: string | undefined) =>
    packagings?.find((item) => item.id === packagingId)?.harga_satuan ?? 0;

  // Perhitungannya diulang di sini — bukan diambil dari `Variant` — karena
  // angkanya harus bergerak saat diketik, sebelum apa pun tersimpan.
  const modalKemasan = (kemasan ?? []).reduce(
    (jumlahnya, baris) =>
      jumlahnya + hargaKemasan(baris?.packaging_id) * Number(baris?.jumlah || 0),
    0,
  );
  const modalTotal = Number(modalBahan || 0) + modalKemasan;
  const margin = Number(hargaJual || 0) - modalTotal;

  // Kemasan yang sudah dipakai baris lain disembunyikan dari dropdown. PK
  // `(variant_id, packaging_id)` melarang duplikat — tanpa penyaringan ini
  // pengguna kena error untuk sesuatu yang seharusnya dicegah UI sejak awal.
  const terpakai = new Set(
    (kemasan ?? []).map((baris) => baris?.packaging_id).filter(Boolean),
  );

  // Pesan `.min(1)` menempel di array-nya sendiri, bukan di baris mana pun,
  // jadi dibaca dari `.root` — bukan dari `errors.kemasan[i]`.
  const errorDaftar = form.formState.errors.kemasan?.root;
  const belumAdaKemasan = (packagings?.length ?? 0) === 0;

  return (
    <Field data-invalid={Boolean(errorDaftar)}>
      <FieldLabel>Kemasan</FieldLabel>

      {fields.length > 0 && (
        <div className="grid gap-2">
          {fields.map((baris, index) => (
            <div key={baris.id} className="flex items-center gap-2">
              <Controller
                control={form.control}
                name={`kemasan.${index}.packaging_id`}
                render={({ field }) => (
                  <Select value={field.value ?? ""} onValueChange={field.onChange}>
                    <SelectTrigger
                      className="flex-1"
                      aria-label={`Kemasan baris ${index + 1}`}
                    >
                      <SelectValue placeholder="Pilih kemasan" />
                    </SelectTrigger>
                    <SelectContent>
                      {(packagings ?? [])
                        .filter(
                          (item) =>
                            !terpakai.has(item.id) || item.id === field.value,
                        )
                        .map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.nama} — {formatCurrency(item.harga_satuan)}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
              />

              {/* Sempit dan bertanda "×" supaya terbaca sebagai pengali, bukan
                  harga. */}
              <span className="text-sm text-muted-foreground">×</span>
              <Input
                type="number"
                aria-label={`Jumlah kemasan baris ${index + 1}`}
                className="w-16"
                {...form.register(`kemasan.${index}.jumlah`)}
              />

              <IconActionButton
                label={`Hapus kemasan baris ${index + 1}`}
                icon={<Trash2Icon />}
                onClick={() => remove(index)}
                className="text-destructive hover:text-destructive"
              />
            </div>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full"
        // Kalau semua kemasan sudah dipakai, baris baru tidak akan punya
        // pilihan tersisa untuk diisi.
        disabled={belumAdaKemasan || terpakai.size >= (packagings?.length ?? 0)}
        // `jumlah` default "1" — string, karena inilah nilai yang dipegang
        // form; mayoritas varian memang pakai satu mika, satu kardus.
        onClick={() => append({ packaging_id: "", jumlah: "1" })}
      >
        <PlusIcon />
        Tambah kemasan
      </Button>

      {errorDaftar && <FieldError errors={[errorDaftar]} />}

      {/* Angka yang sebenarnya dicari pemilik saat menentukan harga. Ditaruh di
          sini, bukan cuma di tabel, supaya bergerak sambil diketik. */}
      <div className="mt-2 grid gap-1 rounded-md border p-3 text-sm">
        <BarisRingkasan label="Modal kemasan" nilai={modalKemasan} />
        <BarisRingkasan label="Modal total" nilai={modalTotal} />
        <div className="flex justify-between border-t pt-1 font-medium">
          <span>Margin</span>
          <span
            className={`tabular-nums${margin < 0 ? " text-destructive" : ""}`}
          >
            {formatCurrency(margin)}
          </span>
        </div>
      </div>
    </Field>
  );
}

function BarisRingkasan({ label, nilai }: { label: string; nilai: number }) {
  return (
    <div className="flex justify-between text-muted-foreground">
      <span>{label}</span>
      <span className="tabular-nums">{formatCurrency(nilai)}</span>
    </div>
  );
}
