"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";
import {
  Controller,
  useFieldArray,
  useWatch,
  type UseFormReturn,
} from "react-hook-form";

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
import { useProducts } from "@/hooks/use-products";
import { formatCurrency } from "@/lib/utils";
import type {
  VariantFormValues,
  VariantInput,
} from "@/validations/variants-validation";

import { hitungHppVarian, keAngka } from "@/lib/count";

type VariantForm = UseFormReturn<VariantFormValues, unknown, VariantInput>;

export function VariantPackagingsField({ form }: { form: VariantForm }) {
  const { data: packagings } = usePackagings();
  const { data: products } = useProducts();

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "kemasan",
  });

  const kemasan = useWatch({ control: form.control, name: "kemasan" });
  const hargaJual = useWatch({ control: form.control, name: "harga_jual" });
  const modalBahan = useWatch({ control: form.control, name: "modal_bahan" });
  const jumlahPcs = useWatch({ control: form.control, name: "jumlah_pcs" });
  const productId = useWatch({ control: form.control, name: "product_id" });

  const hargaKemasan = (packagingId: string | undefined) =>
    packagings?.find((item) => item.id === packagingId)?.harga_satuan ?? 0;

  // Tarif upah milik PRODUK induknya, jadi pratinjau di sini harus ikut
  // mengambilnya — kalau tidak, angka modal di form lebih kecil daripada yang
  // nanti dihitung `v_hpp_varian`.
  const upahPerPcs =
    products?.find((item) => item.id === productId)?.upah_per_pcs ?? 0;

  const { modalKemasan, modalUpah, modalTotal, margin } = hitungHppVarian({
    hargaJual: keAngka(hargaJual),
    modalBahan: keAngka(modalBahan),
    kemasan: (kemasan ?? []).map((baris) => ({
      hargaSatuan: hargaKemasan(baris?.packaging_id),
      jumlah: keAngka(baris?.jumlah),
    })),
    jumlahPcs: keAngka(jumlahPcs),
    upahPerPcs: keAngka(upahPerPcs),
  });

  const terpakai = new Set(
    (kemasan ?? []).map((baris) => baris?.packaging_id).filter(Boolean),
  );

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
                  <Select
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                  >
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
        disabled={belumAdaKemasan || terpakai.size >= (packagings?.length ?? 0)}
        onClick={() => append({ packaging_id: "", jumlah: "1" })}
      >
        <PlusIcon />
        Tambah kemasan
      </Button>

      {errorDaftar && <FieldError errors={[errorDaftar]} />}

      <div className="mt-2 grid gap-1 rounded-md border p-3 text-sm">
        <BarisRingkasan label="Modal kemasan" nilai={modalKemasan} />
        <BarisRingkasan label="Modal upah" nilai={modalUpah} />
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
