import type { HTMLAttributes, ReactNode } from 'react';
import { useTilt } from '@/hooks/useTilt';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** 启用 3D tilt 微交互（默认 false，便于在列表批量关闭）。 */
  tilt?: boolean;
  glass?: boolean;
}

/** 设计系统基础组件：Card（玻璃拟态 + 多层景深 + 可选 3D tilt）。 */
export function Card({ children, className = '', tilt = false, glass = true, ...rest }: CardProps) {
  const { ref, bind } = useTilt<HTMLDivElement>();
  const glassCls = glass ? 'glass' : 'bg-surface border border-line shadow-depth-2';
  return (
    <div
      {...(tilt ? bind : {})}
      ref={tilt ? ref : undefined}
      className={`rounded-xl transition-[transform,box-shadow] duration-300 ${glassCls} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
