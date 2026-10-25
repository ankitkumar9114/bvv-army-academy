import { Icon } from './Icon';
import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react';
import { cn } from '../lib/cn';

// [measured] allen input: text-sm, py-3 px-3.5, rounded-lg, placeholder text-inactive, focus border-default-active.
const control =
  'max-h-12 w-full rounded-lg border bg-surface px-3.5 py-3 text-sm text-ink transition duration-fast placeholder:text-ink-muted focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-fill-inactive disabled:text-ink-muted';
const stateOk = 'border-line-strong hover:border-ink-body focus:border-primary-600 focus:ring-primary-200';
const stateError = 'border-error-bold focus:border-error-bold focus:ring-error-subtle';

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  id: string;
  children: (describedBy: string | undefined) => ReactNode;
}

function Field({ label, hint, error, required, id, children }: FieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-semibold text-ink md:text-sm">
        {label}
        {required && (
          <span aria-hidden className="ml-0.5 text-error">
            *
          </span>
        )}
      </label>
      {children(describedBy)}
      {hint && !error && (
        <p id={hintId} className="text-xs text-ink-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs font-medium text-error">
          {error}
        </p>
      )}
    </div>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

export function Input({ label, hint, error, id, required, className, ...rest }: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <Field label={label} hint={hint} error={error} required={required} id={inputId}>
      {(describedBy) => (
        <input
          id={inputId}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(control, error ? stateError : stateOk, className)}
          {...rest}
        />
      )}
    </Field>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  hint?: string;
  error?: string;
}

export function Select({ label, options, placeholder, hint, error, id, required, className, ...rest }: SelectProps) {
  const autoId = useId();
  const selectId = id ?? autoId;
  return (
    <Field label={label} hint={hint} error={error} required={required} id={selectId}>
      {(describedBy) => (
        <div className="relative">
          <select
            id={selectId}
            required={required}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={cn(control, 'appearance-none pr-10', error ? stateError : stateOk, className)}
            {...rest}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <Icon name="expand_more" className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-body" />
        </div>
      )}
    </Field>
  );
}
