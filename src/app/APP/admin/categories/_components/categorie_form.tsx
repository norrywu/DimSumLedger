"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { FormField } from "@/components/common/form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { CATEGORY_FORM_DEFAULTS } from "@/constants/categories-constant";
import { useCreateCategory } from "@/hooks/use-categories";
import {
  categorySchema,
  type CategoryInput,
} from "@/validations/categories-validation";

export function KategoriForm() {
  const form = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: CATEGORY_FORM_DEFAULTS,
  });

  // Toast dan invalidate diurus hook. Yang dioper ke sini cuma hal yang hook
  // tidak mungkin tahu: mengosongkan form, dan hanya setelah server memastikan
  // datanya tersimpan.
  const { mutate, isPending } = useCreateCategory({
    onSuccess: () => form.reset(CATEGORY_FORM_DEFAULTS),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tambah kategori</CardTitle>
        <CardDescription>
          Nama tidak boleh kembar, tanpa memandang besar-kecil huruf.
        </CardDescription>
      </CardHeader>

      {/* `handleSubmit` menahan submit sampai zodResolver lolos, jadi mutate
          hanya menerima data yang sudah tervalidasi. */}
      <form onSubmit={form.handleSubmit((data) => mutate(data))}>
        <CardContent>
          <FormField
            control={form.control}
            name="nama"
            label="Nama kategori"
            placeholder="mis. Dimsum Kukus"
          />
        </CardContent>

        <CardFooter className="mt-6">
          <Button type="submit" disabled={isPending}>
            {isPending && <Spinner data-icon="inline-start" />}
            Simpan kategori
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
