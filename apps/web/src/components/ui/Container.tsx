import type { HTMLAttributes, ReactNode } from 'react';

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/** 设计系统基础组件：Container（移动端优先的居中栅格）。 */
export function Container({ children, className = '', ...rest }: ContainerProps) {
  return (
    <div className={`mx-auto w-full max-w-6xl px-5 sm:px-8 ${className}`} {...rest}>
      {children}
    </div>
  );
}

interface SectionProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
}

/** 区块间距令牌（section 垂直留白）。 */
export function Section({ children, className = '', ...rest }: SectionProps) {
  return (
    <section className={`py-16 sm:py-22 ${className}`} {...rest}>
      {children}
    </section>
  );
}
