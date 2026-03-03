// src/components/ui/FormField.tsx
// Wrapper de campo de formulário com acessibilidade automática (WCAG 2.1 AA).
// Injeta id, aria-describedby, aria-invalid e aria-required nos filhos via render prop.

import React, { useId } from 'react';

interface FormFieldProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: (props: {
    id: string;
    'aria-describedby': string | undefined;
    'aria-invalid': true | undefined;
    'aria-required': true | undefined;
  }) => React.ReactNode;
}

/**
 * Componente wrapper para campos de formulário com acessibilidade automática.
 *
 * @example
 * <FormField label="CPF" error={errors.cpf} required hint="Somente números">
 *   {(a11y) => (
 *     <input {...a11y} type="text" value={cpf} onChange={handleChange} />
 *   )}
 * </FormField>
 */
export function FormField({ label, error, hint, required, children }: FormFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  const describedBy = [
    error ? errorId : undefined,
    hint ? hintId : undefined,
  ].filter(Boolean).join(' ') || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-sm font-semibold text-slate-700 dark:text-slate-300"
      >
        {label}
        {required && (
          <span aria-hidden="true" className="ml-1 text-red-500">*</span>
        )}
      </label>

      {children({
        id,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
        'aria-required': required ? true : undefined,
      })}

      {hint && !error && (
        <p id={hintId} className="text-xs text-slate-500 dark:text-slate-400">
          {hint}
        </p>
      )}

      {error && (
        <p
          id={errorId}
          role="alert"
          aria-live="polite"
          className="text-xs font-medium text-red-600 dark:text-red-400 flex items-center gap-1"
        >
          <span aria-hidden="true">⚠</span>
          {error}
        </p>
      )}
    </div>
  );
}
