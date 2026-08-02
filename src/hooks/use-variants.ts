"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { getVariants } from "@/clients/variants";
import { VARIANTS_KEY } from "@/constants/variants-constant";
import { createVarian, deleteVarian, updateVarian } from "@/servers/variants";
import type { VariantActionResult } from "@/types/variants";
import type { VariantInput } from "@/validations/variants-validation";

/**
 * Callback untuk hal yang hook tidak mungkin tahu — mis. menutup sheet atau
 * dialog konfirmasi. Toast dan invalidate TIDAK dioper lewat sini karena
 * seragam di seluruh aplikasi; keduanya diurus hook.
 */
type MutationOptions = { onSuccess?: () => void };

/**
 * Server Action mengembalikan kegagalan sebagai nilai, bukan lemparan (lihat
 * `VariantActionResult`). react-query butuh lemparan untuk masuk state error,
 * jadi diubah di sini — di sisi client, tempat pesannya tidak diredaksi Next.
 */
function unwrap(result: VariantActionResult) {
  if (!result.success) throw new Error(result.message);

  return result;
}

export function useVariants() {
  return useQuery({
    queryKey: VARIANTS_KEY,
    queryFn: getVariants,
  });
}

/**
 * Yang masuk mutation adalah `VariantInput` (hasil validasi, angkanya sudah
 * number), bukan `VariantFormValues` yang masih string. `handleSubmit` milik
 * react-hook-form yang mengonversinya, lewat generic ketiga di `TriggerSheet`.
 */
export function useCreateVariant(options?: MutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: VariantInput) => unwrap(await createVarian(input)),
    onSuccess: (result) => {
      toast.success(result.message);
      // Cukup VARIANTS_KEY: daftar produk tidak ikut berubah saat varian baru
      // ditambahkan.
      queryClient.invalidateQueries({ queryKey: VARIANTS_KEY });
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateVariant(options?: MutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    // Satu objek, bukan dua argumen: `mutate` milik react-query cuma menerima
    // satu variabel.
    mutationFn: async ({ id, input }: { id: string; input: VariantInput }) =>
      unwrap(await updateVarian(id, input)),
    onSuccess: (result) => {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: VARIANTS_KEY });
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteVariant(options?: MutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => unwrap(await deleteVarian(id)),
    onSuccess: (result) => {
      toast.success(result.message);
      // Menandai cache basi; react-query fetch ulang selama masih ada komponen
      // yang memakai key ini.
      queryClient.invalidateQueries({ queryKey: VARIANTS_KEY });
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}
