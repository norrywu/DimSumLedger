"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { getPackagings } from "@/clients/packagings";
import { PACKAGINGS_KEY } from "@/constants/packagings-constant";
import { createKemasan, deleteKemasan, updateKemasan } from "@/servers/packagings";
import type { PackagingActionResult } from "@/types/packagings";
import type { PackagingInput } from "@/validations/packagings-validation";

/**
 * Callback untuk hal yang hook tidak mungkin tahu — mis. menutup sheet atau
 * dialog konfirmasi. Toast dan invalidate TIDAK dioper lewat sini karena
 * seragam di seluruh aplikasi; keduanya diurus hook.
 */
type MutationOptions = { onSuccess?: () => void };

/**
 * Server Action mengembalikan kegagalan sebagai nilai, bukan lemparan (lihat
 * `PackagingActionResult`). react-query butuh lemparan untuk masuk state error,
 * jadi diubah di sini — di sisi client, tempat pesannya tidak diredaksi Next.
 */
function unwrap(result: PackagingActionResult) {
  if (!result.success) throw new Error(result.message);

  return result;
}

export function usePackagings() {
  return useQuery({
    queryKey: PACKAGINGS_KEY,
    queryFn: getPackagings,
  });
}

/**
 * Yang masuk mutation adalah `PackagingInput` (hasil validasi, harganya sudah
 * number), bukan `PackagingFormValues` yang masih string. `handleSubmit` milik
 * react-hook-form yang mengonversinya, lewat generic ketiga di `TriggerSheet`.
 */
export function useCreatePackaging(options?: MutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: PackagingInput) =>
      unwrap(await createKemasan(input)),
    onSuccess: (result) => {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: PACKAGINGS_KEY });
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdatePackaging(options?: MutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    // Satu objek, bukan dua argumen: `mutate` milik react-query cuma menerima
    // satu variabel.
    mutationFn: async ({ id, input }: { id: string; input: PackagingInput }) =>
      unwrap(await updateKemasan(id, input)),
    onSuccess: (result) => {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: PACKAGINGS_KEY });
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

export function useDeletePackaging(options?: MutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => unwrap(await deleteKemasan(id)),
    onSuccess: (result) => {
      toast.success(result.message);
      // Menandai cache basi; react-query fetch ulang selama masih ada komponen
      // yang memakai key ini.
      queryClient.invalidateQueries({ queryKey: PACKAGINGS_KEY });
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}
