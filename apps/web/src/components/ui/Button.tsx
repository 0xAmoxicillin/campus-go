import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

type Variant = 'primary' | 'secondary' | 'ghost' | 'accent' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'ref'> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors ' +
  'focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none select-none';

const variants: Record<Variant, string> = {
  primary:
    'bg-brand-gradient text-white shadow-depth-2 hover:shadow-glow',
  secondary:
    'bg-surface text-ink border border-line hover:bg-surface-soft shadow-depth-1',
  outline:
    'bg-transparent text-brand-700 border border-brand-300 hover:bg-brand-50',
  ghost: 'bg-transparent text-ink-soft hover:bg-surface-soft',
  accent:
    'bg-accent-500 text-white shadow-depth-2 hover:bg-accent-600',
};

const sizes: Record<Size, string> = {
  sm: 'text-sm px-3.5 py-2',
  md: 'text-base px-5 py-2.5',
  lg: 'text-lg px-7 py-3.5',
};

/** 设计系统基础组件：Button（玻璃/景深 + 微动效 hover）。 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', className = '', children, ...rest },
  ref,
) {
  const reduced = useReducedMotion();
  if (reduced) {
    return (
      <button ref={ref} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...rest}>
        {children}
      </button>
    );
  }
  return (
    <motion.button
      ref={ref}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...(rest as HTMLMotionProps<'button'>)}
    >
      {children}
    </motion.button>
  );
});
