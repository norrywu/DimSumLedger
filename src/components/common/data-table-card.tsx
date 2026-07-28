import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type DataTableColumn<T> = {
  header: string;
  headClassName?: string;
  cellClassName?: string;
  render: (row: T) => ReactNode;
};

/**
 * Card berisi table yang kolomnya digerakkan konfigurasi.
 * Sengaja bukan client component: `render` berupa fungsi, jadi
 * kolom harus dibangun di sisi server (mis. dari constants/).
 */
export function DataTableCard<T>({
  title,
  headerAction,
  caption,
  columns,
  data,
  rowKey,
  emptyMessage = "Belum ada data",
}: {
  title: string;
  headerAction?: ReactNode;
  caption?: string;
  columns: DataTableColumn<T>[];
  data: T[];
  rowKey: (row: T) => string;
  emptyMessage?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        {headerAction}
      </CardHeader>
      <CardContent>
        <Table>
          {caption && <TableCaption>{caption}</TableCaption>}
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.header} className={column.headClassName}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={rowKey(row)}>
                {columns.map((column) => (
                  <TableCell
                    key={column.header}
                    className={column.cellClassName}
                  >
                    {column.render(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            {data.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center text-muted-foreground py-6"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
