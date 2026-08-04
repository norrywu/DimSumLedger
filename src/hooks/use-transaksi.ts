"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { simpanTransaksi } from "@/servers/transaksi";
import type { TransaksiActionResult } from "@/types/cashier";
import type { TransaksiInput } from "@/validations/cashier-validation";

function unwrap(result: TransaksiActionResult) {
  if (!result.success) throw new Error(result.message);

  return result;
}

export function useSimpanTransaksi(options?: { onSuccess?: () => void }) {
  return useMutation({
    mutationFn: async (input: TransaksiInput) =>
      unwrap(await simpanTransaksi(input)),
    onSuccess: (result) => {
      toast.success(result.message);
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}
