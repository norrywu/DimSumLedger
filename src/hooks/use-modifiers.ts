"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { getModifiers } from "@/clients/modifiers";
import { MODIFIERS_KEY } from "@/constants/modifiers-constant";
import { createExtra, deleteExtra, updateExtra } from "@/servers/modifiers";
import type { ModifierActionResult } from "@/types/modifiers";
import type { ModifierInput } from "@/validations/modifiers-validation";

type MutationOptions = { onSuccess?: () => void };

function unwrap(result: ModifierActionResult) {
  if (!result.success) throw new Error(result.message);

  return result;
}

export function useModifiers() {
  return useQuery({
    queryKey: MODIFIERS_KEY,
    queryFn: getModifiers,
  });
}

export function useCreateModifier(options?: MutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ModifierInput) =>
      unwrap(await createExtra(input)),
    onSuccess: (result) => {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: MODIFIERS_KEY });
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateModifier(options?: MutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: ModifierInput }) =>
      unwrap(await updateExtra(id, input)),
    onSuccess: (result) => {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: MODIFIERS_KEY });
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteModifier(options?: MutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => unwrap(await deleteExtra(id)),
    onSuccess: (result) => {
      toast.success(result.message);

      queryClient.invalidateQueries({ queryKey: MODIFIERS_KEY });
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}
