import type { Control, FieldValues, Path } from "react-hook-form";
import type { ComponentProps, ReactNode } from "react";
import { Input } from "@/components/ui/input";

/** Generik supaya daftar opsi bisa membawa union literalnya (mis. kategori). */
export type SelectOption<T extends string = string> = {
  value: T;
  label: string;
};

/**
 * `TTransformed` ikut dibawa karena `useForm` boleh mengeluarkan tipe yang
 * berbeda dari isi form-nya (lihat `TriggerSheet`). Tanpa parameter ini,
 * `control` dari form yang bertransform ditolak TypeScript. Default-nya sama
 * dengan `T`, jadi pemakai biasa cukup menulis satu parameter.
 */
export type FormFieldProps<T extends FieldValues, TTransformed = T> = {
  control: Control<T, unknown, TTransformed>;
  name: Path<T>;
  label: string | ReactNode;
  type?: ComponentProps<typeof Input>["type"] | "select" | "switch";
  placeholder?: string;
  autoComplete?: string;
  /** Pilihan dropdown; hanya dipakai bila type === 'select'. */
  options?: SelectOption[];
};

export type PasswordInputProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label: string | ReactNode;
  placeholder?: string;
  autoComplete?: string;
  labelSuffix?: ReactNode;
};
