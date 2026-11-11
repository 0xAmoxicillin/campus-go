import { forwardRef, useId } from 'react';
import type { SelectHTMLAttributes } from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
}

/** 设计系统基础组件：Select（与 Input 一致的玻璃描边 + 无障碍 label/aria）。 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hint, options, className = '', id, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-ink-soft">
          {label}
        </label>
      )}
      <select
        id={inputId}
        ref={ref}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-err` : hint ? `${inputId}-hint` : undefined}
        className={`w-full rounded-lg border bg-surface/70 px-3.5 py-2.5 text-base text-ink outline-none transition
          focus:border-brand-400 focus:ring-2 focus:ring-brand-400/40
          ${error ? 'border-accent-500 focus:border-accent-500 focus:ring-accent-500/30' : 'border-line'}
          ${className}`}
        {...rest}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error ? (
        <p id={`${inputId}-err`} className="mt-1.5 text-2xs text-accent-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="mt-1.5 text-2xs text-ink-faint">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
