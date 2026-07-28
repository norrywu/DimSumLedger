"use client"

import { Controller, type FieldValues } from 'react-hook-form'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { ChevronDownIcon } from 'lucide-react'
import {
  Field,
  FieldError,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { FormFieldProps } from '@/types/form'

export function FormField<T extends FieldValues = FieldValues>({
  control,
  name,
  label,
  type = 'text',
  placeholder,
  autoComplete,
  options,
}: FormFieldProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        // Value tanggal disimpan sebagai string `YYYY-MM-DD`; ubah ke Date untuk Calendar.
        const dateValue =
          typeof field.value === 'string' && field.value
            ? new Date(field.value)
            : undefined

        return (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
            {type === 'select' ? (
              <Select
                value={field.value ?? ''}
                onValueChange={field.onChange}
              >
                <SelectTrigger
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  className="w-full"
                >
                  <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {(options ?? []).map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : type === 'date' ? (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    id={field.name}
                    onBlur={field.onBlur}
                    data-empty={!dateValue}
                    aria-invalid={fieldState.invalid}
                    className="w-full justify-between text-left font-normal data-[empty=true]:text-muted-foreground"
                  >
                    {dateValue
                      ? format(dateValue, 'PPP', { locale: idLocale })
                      : (placeholder ?? 'Pilih tanggal')}
                    <ChevronDownIcon />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateValue}
                    defaultMonth={dateValue}
                    disabled={{ after: new Date() }}
                    onSelect={(date) =>
                      field.onChange(date ? format(date, 'yyyy-MM-dd') : '')
                    }
                    locale={idLocale}
                  />
                </PopoverContent>
              </Popover>
            ) : (
              <Input
                {...field}
                id={field.name}
                type={type}
                placeholder={placeholder}
                aria-invalid={fieldState.invalid}
                autoComplete={autoComplete}
              />
            )}
            {fieldState.invalid && (
              <FieldError errors={[fieldState.error]} />
            )}
          </Field>
        )
      }}
    />
  )
}
