"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { getProducts } from "@/clients/products";
import { PRODUCTS_KEY } from "@/constants/products-constant";
import { createProduk, deleteProduk, updateProduk } from "@/servers/products";
import type { ProductActionResult } from "@/types/products";
import type { ProductInput } from "@/validations/products-validation";

/**
 * Callback untuk hal yang hook tidak mungkin tahu — mis. menutup sheet atau
 * dialog konfirmasi. Toast dan invalidate TIDAK dioper lewat sini karena
 * seragam di seluruh aplikasi; keduanya diurus hook.
 */
type MutationOptions = { onSuccess?: () => void };

/**
 * Server Action mengembalikan kegagalan sebagai nilai, bukan lemparan (lihat
 * `ProductActionResult`). react-query butuh lemparan untuk masuk state error,
 * jadi diubah di sini — di sisi client, tempat pesannya tidak diredaksi Next.
 */
function unwrap(result: ProductActionResult) {
  if (!result.success) throw new Error(result.message);

  return result;
}

export function useProducts() {
  return useQuery({
    queryKey: PRODUCTS_KEY,
    queryFn: getProducts,
  });
}

export function useCreateProduct(options?: MutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ProductInput) => unwrap(await createProduk(input)),
    onSuccess: (result) => {
      toast.success(result.message);
      // Cukup PRODUCTS_KEY: daftar kategori tidak ikut berubah saat produk
      // baru ditambahkan.
      queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY });
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateProduct(options?: MutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    // Satu objek, bukan dua argumen: `mutate` milik react-query cuma menerima
    // satu variabel.
    mutationFn: async ({ id, input }: { id: string; input: ProductInput }) =>
      unwrap(await updateProduk(id, input)),
    onSuccess: (result) => {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY });
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteProduct(options?: MutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => unwrap(await deleteProduk(id)),
    onSuccess: (result) => {
      toast.success(result.message);
      // Menandai cache basi; react-query fetch ulang selama masih ada komponen
      // yang memakai key ini.
      queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY });
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}
