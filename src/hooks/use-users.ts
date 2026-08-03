"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { getUsers } from "@/clients/users";
import { USERS_KEY } from "@/constants/users-constant";
import {
  createPengguna,
  deletePengguna,
  updatePengguna,
} from "@/servers/users";
import type { UserActionResult } from "@/types/users";
import type { UserInput } from "@/validations/users-validation";

/**
 * Callback untuk hal yang hook tidak mungkin tahu — mis. menutup sheet. Toast
 * dan invalidate TIDAK dioper lewat sini karena seragam di seluruh aplikasi.
 */
type MutationOptions = { onSuccess?: () => void };

/**
 * Server Action mengembalikan kegagalan sebagai nilai, bukan lemparan (lihat
 * `UserActionResult`). react-query butuh lemparan untuk masuk state error, jadi
 * diubah di sini — di sisi client, tempat pesannya tidak diredaksi Next.
 */
function unwrap(result: UserActionResult) {
  if (!result.success) throw new Error(result.message);

  return result;
}

export function useUsers() {
  return useQuery({
    queryKey: USERS_KEY,
    queryFn: getUsers,
  });
}

export function useCreateUser(options?: MutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UserInput) => unwrap(await createPengguna(input)),
    onSuccess: (result) => {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: USERS_KEY });
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateUser(options?: MutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    // Satu objek, bukan dua argumen: `mutate` milik react-query cuma menerima
    // satu variabel.
    mutationFn: async ({ id, input }: { id: string; input: UserInput }) =>
      unwrap(await updatePengguna(id, input)),
    onSuccess: (result) => {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: USERS_KEY });
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteUser(options?: MutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => unwrap(await deletePengguna(id)),
    onSuccess: (result) => {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: USERS_KEY });
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}
