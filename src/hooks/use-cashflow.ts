"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { getCashFlow } from "@/clients/cashflow";
import { CASHFLOW_KEY } from "@/constants/cashflow-constant";
import {
  createCashFlow,
  deleteCashFlow,
  setorOmzet,
  updateCashFlow,
} from "@/servers/cashflow";
import type { CashFlowActionResult } from "@/types/cashflow";
import type { CashFlowInput } from "@/validations/cashflow-validation";

type MutationOptions = { onSuccess?: () => void };

function unwrap(result: CashFlowActionResult) {
  if (!result.success) throw new Error(result.message);

  return result;
}

export function useCashFlow(dari: string, sampai: string) {
  return useQuery({
    queryKey: [...CASHFLOW_KEY, dari, sampai],
    queryFn: () => getCashFlow(dari, sampai),
  });
}

export function useCreateCashFlow(options?: MutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CashFlowInput) =>
      unwrap(await createCashFlow(input)),
    onSuccess: (result) => {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: CASHFLOW_KEY });
      options?.onSuccess?.();
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useUpdateCashFlow(options?: MutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: CashFlowInput }) =>
      unwrap(await updateCashFlow(id, input)),
    onSuccess: (result) => {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: CASHFLOW_KEY });
      options?.onSuccess?.();
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useDeleteCashFlow(options?: MutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => unwrap(await deleteCashFlow(id)),
    onSuccess: (result) => {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: CASHFLOW_KEY });
      options?.onSuccess?.();
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useSetorOmzet(options?: MutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tanggal: string) => unwrap(await setorOmzet(tanggal)),
    onSuccess: (result) => {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: CASHFLOW_KEY });
      options?.onSuccess?.();
    },
    onError: (error) => toast.error(error.message),
  });
}
