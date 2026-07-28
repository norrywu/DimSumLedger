/** Bentuk state yang dikembalikan Server Action login ke `useActionState`. */
export type LoginState = {
  message: string;
  fieldErrors?: Partial<Record<"email" | "password", string[]>>;
};
