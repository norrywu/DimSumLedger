import type { SheetField } from "@/components/sheet-trigger";
import type { ModifierFormValues } from "@/validations/modifiers-validation";

export const MODIFIERS_KEY = ["modifiers"];

export const MODIFIER_FORM_DEFAULTS: ModifierFormValues = {
  nama: "",
  price: "",
};

export const MODIFIER_FIELDS: SheetField<ModifierFormValues>[] = [
  { name: "nama", label: "Nama extra", placeholder: "mis. Saus Extra" },
  {
    name: "price",
    label: "Harga",
    type: "number",
    placeholder: "mis. 2000",
  },
];
