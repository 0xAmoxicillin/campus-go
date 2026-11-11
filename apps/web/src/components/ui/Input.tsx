import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
}

/** 设计系统基础组件：Input（玻璃描边 + 错误态 + 无障碍 label/aria）。 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, icon, className = '', id, ...rest },
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
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          ref={ref}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-err` : hint ? `${inputId}-hint` : undefined}
          className={`w-full rounded-lg border bg-surface/70 px-3.5 py-2.5 text-base text-ink outline-none transition
            placeholder:text-ink-faint focus:border-brand-400 focus:ring-2 focus:ring-brand-400/40
            ${icon ? 'pl-10' : ''} ${error ? 'border-accent-500 focus:border-accent-500 focus:ring-accent-500/30' : 'border-line'}
            ${className}`}
          {...rest}
        />
      </div>
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
