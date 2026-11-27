"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { getStockHistory } from "@/clients/stock";
import { KATALOG_JUAL_KEY } from "@/constants/cashier-constant";
import { PRODUCTS_KEY } from "@/constants/products-constant";
import { STOCK_HISTORY_KEY } from "@/constants/stock-constant";
import {
  catatStok,
  hapusRiwayatStok,
  ubahRiwayatStok,
} from "@/servers/stock";
import type { StockActionResult } from "@/types/stock";
import type { StockHistoryInput } from "@/validations/stock-validation";

type MutationOptions = { onSuccess?: () => void };

function unwrap(result: StockActionResult) {
  if (!result.success) throw new Error(result.message);

  return result;
}

export function useStockHistory(
  dari: string,
  sampai: string,
  productId?: string,
) {
  return useQuery({
    queryKey: [...STOCK_HISTORY_KEY, dari, sampai, productId ?? null],
    queryFn: () => getStockHistory(dari, sampai, productId),
  });
}

export function useCreateStockHistory(options?: MutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: StockHistoryInput) =>
      unwrap(await catatStok(input)),
    onSuccess: (result) => {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: STOCK_HISTORY_KEY });
      queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY });
      queryClient.invalidateQueries({ queryKey: KATALOG_JUAL_KEY });
      options?.onSuccess?.();
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useUpdateStockHistory(options?: MutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: StockHistoryInput;
    }) => unwrap(await ubahRiwayatStok(id, input)),
    onSuccess: (result) => {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: STOCK_HISTORY_KEY });
      queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY });
      queryClient.invalidateQueries({ queryKey: KATALOG_JUAL_KEY });
      options?.onSuccess?.();
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useDeleteStockHistory(options?: MutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => unwrap(await hapusRiwayatStok(id)),
    onSuccess: (result) => {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: STOCK_HISTORY_KEY });
      queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY });
      queryClient.invalidateQueries({ queryKey: KATALOG_JUAL_KEY });
      options?.onSuccess?.();
    },
    onError: (error) => toast.error(error.message),
  });
}
