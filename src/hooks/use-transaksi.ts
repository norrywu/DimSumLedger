"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { getRiwayatTransaksi } from "@/clients/transaksi";
import { RIWAYAT_TRANSAKSI_KEY } from "@/constants/cashier-constant";
import { batalkanTransaksi, simpanTransaksi } from "@/servers/transaksi";
import type { TransaksiActionResult } from "@/types/cashier";
import type { TransaksiInput } from "@/validations/cashier-validation";

function unwrap(result: TransaksiActionResult) {
  if (!result.success) throw new Error(result.message);

  return result;
}

export function useRiwayatTransaksi() {
  return useQuery({
    queryKey: RIWAYAT_TRANSAKSI_KEY,
    queryFn: getRiwayatTransaksi,
  });
}

export function useBatalkanTransaksi(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => unwrap(await batalkanTransaksi(id)),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: RIWAYAT_TRANSAKSI_KEY });
      toast.success(result.message);
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

export function useSimpanTransaksi(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: TransaksiInput) =>
      unwrap(await simpanTransaksi(input)),
    onSuccess: (result) => {
      // Tanpa ini, kasir yang pindah ke Riwayat sesaat setelah menyimpan masih
      // melihat daftar lama dan mengira transaksinya gagal.
      queryClient.invalidateQueries({ queryKey: RIWAYAT_TRANSAKSI_KEY });
      toast.success(result.message);
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}
