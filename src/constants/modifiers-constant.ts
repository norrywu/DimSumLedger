import type { SheetField } from "@/components/sheet-trigger";
import type { ModifierFormValues } from "@/validations/modifiers-validation";

export const MODIFIERS_KEY = ["modifiers"];

export const MODIFIER_FORM_DEFAULTS: ModifierFormValues = {
  nama: "",
  tambahan_harga: "",
  tambahan_modal: "",
};

export const MODIFIER_FIELDS: SheetField<ModifierFormValues>[] = [
  { name: "nama", label: "Nama extra", placeholder: "mis. Chili Oil" },
  {
    name: "tambahan_harga",
    label: "Tambahan harga",
    type: "number",
    placeholder: "mis. 5000",
  },
  {
    name: "tambahan_modal",
    label: "Tambahan modal",
    type: "number",
    placeholder: "mis. 1200",
  },
];
