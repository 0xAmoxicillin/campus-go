import type { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { ToastViewport } from '@/components/ui/Toast';

/** 官网通用布局：Navbar + 内容 + Footer + 全局 Toast。 */
export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <ToastViewport />
    </div>
  );
}
