import type { Control, FieldValues, Path } from "react-hook-form";
import type { ComponentProps, ReactNode } from "react";
import { Input } from "@/components/ui/input";

/** Generik supaya daftar opsi bisa membawa union literalnya (mis. kategori). */
export type SelectOption<T extends string = string> = {
  value: T;
  label: string;
};

export type FormFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label: string | ReactNode;
  type?: ComponentProps<typeof Input>["type"] | "select";
  placeholder?: string;
  autoComplete?: string;
  /** Pilihan dropdown; hanya dipakai bila type === 'select'. */
  options?: SelectOption[];
};

export type PasswordInputProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label: string | ReactNode;
  autoComplete?: string;
  labelSuffix?: ReactNode;
};
