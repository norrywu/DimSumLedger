"use client";

import { DataTableCard } from "@/components/common/data-table-card";
import { useCategories, useDeleteCategory } from "@/hooks/use-categories";
import type { Category } from "@/types/categories";
import { categoryColumns } from "./columns";

export function CategoriesTable() {
  const { data, isPending, isError, error } = useCategories();
  const { mutate: deleteCategorie, isPending: isDeleting } =
    useDeleteCategory();

  const columns = categoryColumns({
    onDelete: deleteCategorie,
    isDeleting,
  });

  return (
    <DataTableCard<Category>
      title="Daftar kategori"
      columns={columns}
      data={data ?? []}
      rowKey={(row) => row.id}
      // Card tetap terpasang di ketiga keadaan supaya layout tidak melompat.
      emptyMessage={
        isPending ? "Memuat…" : isError ? error.message : "Belum ada kategori."
      }
    />
  );
}
