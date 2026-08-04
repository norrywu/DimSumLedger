"use client";

import { useWatch, type UseFormReturn } from "react-hook-form";

import { FormField } from "@/components/common/form";
import { TriggerSheet } from "@/components/sheet-trigger";
import {
  CASHFLOW_FIELDS,
  cashFlowDefaults,
  kategoriUntuk,
} from "@/constants/cashflow-constant";
import { useCreateCashFlow, useUpdateCashFlow } from "@/hooks/use-cashflow";
import type { CashFlow } from "@/types/cashflow";
import {
  cashFlowSchema,
  type CashFlowFormValues,
  type CashFlowInput,
} from "@/validations/cashflow-validation";

export type CashFlowFormTarget =
  | { mode: "tambah" }
  | { mode: "ubah"; baris: CashFlow };

export function CashFlowFormSheet({
  target,
  open,
  onOpenChange,
}: {
  target: CashFlowFormTarget;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const tutup = () => onOpenChange(false);

  const { mutate: create, isPending: isCreating } = useCreateCashFlow({
    onSuccess: tutup,
  });
  const { mutate: update, isPending: isUpdating } = useUpdateCashFlow({
    onSuccess: tutup,
  });

  const isUbah = target.mode === "ubah";

  const handleSubmit = (data: CashFlowInput) => {
    if (target.mode === "ubah") {
      update({ id: target.baris.id, input: data });
      return;
    }

    create(data);
  };

  return (
    <TriggerSheet<CashFlowFormValues, CashFlowInput>
      open={open}
      onOpenChange={onOpenChange}
      fields={CASHFLOW_FIELDS}
      sheetTitle={isUbah ? "Ubah catatan" : "Catat arus kas"}
      sheetDescription="Pemasukan dan pengeluaran di luar penjualan kasir."
      defaultValues={
        target.mode === "ubah"
          ? {
              type: target.baris.type as "income" | "expense",
              amount: target.baris.amount.toString(),
              category: target.baris.category,
              description: target.baris.description ?? "",
              transaction_date: target.baris.transaction_date,
            }
          : cashFlowDefaults()
      }
      schema={cashFlowSchema}
      onSubmit={handleSubmit}
      submitLabel={isUbah ? "Simpan perubahan" : "Simpan catatan"}
      isPending={isCreating || isUpdating}
    >
      {(form) => <IsianKategori form={form} />}
    </TriggerSheet>
  );
}

/**
 * Terpisah supaya `useWatch` punya komponen sendiri: dipanggil langsung di
 * render-prop, hook-nya ikut render ulang seluruh sheet tiap ketikan.
 */
function IsianKategori({
  form,
}: {
  form: UseFormReturn<CashFlowFormValues, unknown, CashFlowInput>;
}) {
  const type = useWatch({ control: form.control, name: "type" });

  return (
    <>
      <FormField
        control={form.control}
        name="category"
        label="Kategori"
        type="select"
        placeholder="Pilih kategori"
        options={kategoriUntuk(type)}
      />
      <FormField
        control={form.control}
        name="description"
        label="Keterangan"
        placeholder="Opsional"
      />
    </>
  );
}
