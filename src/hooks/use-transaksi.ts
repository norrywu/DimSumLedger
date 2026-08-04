"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { getRiwayatTransaksi, getTransaksiById } from "@/clients/transaksi";
import {
  RIWAYAT_PER_HALAMAN,
  RIWAYAT_TRANSAKSI_KEY,
  TRANSAKSI_DETAIL_KEY,
} from "@/constants/cashier-constant";
import { batalkanTransaksi, simpanTransaksi } from "@/servers/transaksi";
import type { TransaksiActionResult } from "@/types/cashier";
import type { TransaksiInput } from "@/validations/cashier-validation";

function unwrap(result: TransaksiActionResult) {
  if (!result.success) throw new Error(result.message);

  return result;
}

export function useRiwayatTransaksi() {
  return useInfiniteQuery({
    queryKey: RIWAYAT_TRANSAKSI_KEY,
    queryFn: ({ pageParam }) => getRiwayatTransaksi(pageParam),
    initialPageParam: undefined as string | undefined,
    // Halaman yang kurang dari sepenuh berarti sudah mentok; kalau pas penuh,
    // `created_at` baris terakhir jadi kursor halaman berikutnya.
    getNextPageParam: (lastPage) =>
      lastPage.length < RIWAYAT_PER_HALAMAN
        ? undefined
        : lastPage.at(-1)?.created_at,
  });
}

/** Kunci terpisah dari riwayat supaya invalidasi daftar tidak ikut menarik ulang nota yang sedang dibuka. */
export function useTransaksi(id: string | null) {
  return useQuery({
    queryKey: [...TRANSAKSI_DETAIL_KEY, id],
    queryFn: () => getTransaksiById(id as string),
    enabled: id !== null,
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

export function useSimpanTransaksi(options?: {
  onSuccess?: (id: string) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: TransaksiInput) =>
      unwrap(await simpanTransaksi(input)),
    onSuccess: (result) => {
      // Tanpa ini, kasir yang pindah ke Riwayat sesaat setelah menyimpan masih
      // melihat daftar lama dan mengira transaksinya gagal.
      queryClient.invalidateQueries({ queryKey: RIWAYAT_TRANSAKSI_KEY });
      toast.success(result.message);
      options?.onSuccess?.(result.id);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}
