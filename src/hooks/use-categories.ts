"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { getCategories } from "@/clients/categories";
import { CATEGORIES_KEY } from "@/constants/categories-constant";
import { createKategori, deleteKategori } from "@/servers/categories";
import type { CategoryActionResult } from "@/types/categories";
import type { CategoryInput } from "@/validations/categories-validation";

/**
 * Callback untuk hal yang hook tidak mungkin tahu — mis. `form.reset()`.
 * Toast dan invalidate TIDAK dioper lewat sini karena seragam di seluruh
 * aplikasi; keduanya diurus hook.
 */
type MutationOptions = { onSuccess?: () => void };

/**
 * Server Action mengembalikan kegagalan sebagai nilai, bukan lemparan (lihat
 * `CategoryActionResult`). react-query butuh lemparan untuk masuk state error,
 * jadi diubah di sini — di sisi client, tempat pesannya tidak diredaksi Next.
 */
function unwrap(result: CategoryActionResult) {
  if (!result.success) throw new Error(result.message);

  return result;
}

export function useCategories() {
  return useQuery({
    queryKey: CATEGORIES_KEY,
    queryFn: getCategories,
  });
}

export function useCreateCategory(options?: MutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CategoryInput) =>
      unwrap(await createKategori(input)),
    onSuccess: (result) => {
      toast.success(result.message);
      // Menandai cache basi; react-query fetch ulang selama masih ada komponen
      // yang memakai key ini.
      queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY });
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteCategory(options?: MutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => unwrap(await deleteKategori(id)),
    onSuccess: (result) => {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY });
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}
