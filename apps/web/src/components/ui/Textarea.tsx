import { forwardRef, useId } from 'react';
import type { TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

/** 设计系统基础组件：Textarea（与 Input 一致的玻璃描边 + 错误态 + 无障碍 label/aria）。 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, className = '', id, rows = 4, ...rest },
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
      <textarea
        id={inputId}
        ref={ref}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-err` : hint ? `${inputId}-hint` : undefined}
        className={`w-full resize-y rounded-lg border bg-surface/70 px-3.5 py-2.5 text-base text-ink outline-none transition
          placeholder:text-ink-faint focus:border-brand-400 focus:ring-2 focus:ring-brand-400/40
          ${error ? 'border-accent-500 focus:border-accent-500 focus:ring-accent-500/30' : 'border-line'}
          ${className}`}
        {...rest}
      />
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
