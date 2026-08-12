"use client";

import { startTransition, useActionState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { cn } from "@/lib/utils";
import { FormField } from "@/components/common/form";
import { PasswordInput } from "@/components/common/password-input";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup } from "@/components/ui/field";
import {
  INITIAL_LOGIN_STATE,
  LOGIN_DEFAULT_VALUES,
} from "@/constants/auth";
import { login } from "@/servers/auth";
import { loginSchema, type LoginValues } from "@/validations/auth";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [state, formAction, isPending] = useActionState(
    login,
    INITIAL_LOGIN_STATE,
  );

  const { control, handleSubmit } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: LOGIN_DEFAULT_VALUES,
  });

  // Validasi browser lolos dulu, baru Server Action dipanggil. Server tetap
  // memvalidasi ulang dengan skema yang sama.
  const onSubmit = handleSubmit((values) => {
    const formData = new FormData();
    formData.set("email", values.email);
    formData.set("password", values.password);

    startTransition(() => formAction(formData));
  });

  return (
    <form
      {...props}
      onSubmit={onSubmit}
      className={cn("flex flex-col gap-6", className)}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Login to your account</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Enter your email below to login to your account
          </p>
        </div>

        <FormField
          control={control}
          name="email"
          label="Email"
          type="email"
          placeholder="m@example.com"
          autoComplete="email"
        />

        <PasswordInput
          control={control}
          name="password"
          label="Password"
          placeholder="••••••••"
          autoComplete="current-password"
        />

        {state.message && (
          <Field data-invalid>
            <FieldError role="alert">{state.message}</FieldError>
          </Field>
        )}

        <Field>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Memproses..." : "Login"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
