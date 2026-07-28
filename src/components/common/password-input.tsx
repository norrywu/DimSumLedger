"use client"

import { useState } from 'react'
import { Controller, type FieldValues } from 'react-hook-form'
import {
  Field,
  FieldError,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { EyeIcon, EyeOffIcon } from 'lucide-react'
import type { PasswordInputProps } from '@/types/form'

export function PasswordInput<T extends FieldValues = FieldValues>({
  control,
  name,
  label,
  autoComplete,
  labelSuffix,
}: PasswordInputProps<T>) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <div className="flex items-center">
            <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
            {labelSuffix}
          </div>
          <div className="relative">
            <Input
              {...field}
              id={field.name}
              type={showPassword ? 'text' : 'password'}
              aria-invalid={fieldState.invalid}
              autoComplete={autoComplete}
              className="pr-9"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="absolute right-1 top-1/2 -translate-y-1/2"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </Button>
          </div>
          {fieldState.invalid && (
            <FieldError errors={[fieldState.error]} />
          )}
        </Field>
      )}
    />
  )
}
