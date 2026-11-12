import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Button } from './Button';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  /** 弹窗底部操作区（标题固定，操作区固定，中间内容区可滚动）。可选。 */
  footer?: ReactNode;
  children: ReactNode;
}

/**
 * 设计系统基础组件：Modal（玻璃卡 + 渐入，Esc/点击遮罩关闭，a11y role=dialog）。
 * 修复：短屏溢出时整体限制在视口内（max-h），标题与底部操作区固定、中间内容区滚动，
 * 保证 1280×720 等高度不足场景下也能完整填写并提交。
 */
export function Modal({ open, onClose, title, footer, children }: ModalProps) {
  const reduced = useReducedMotion();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0 : 0.2 }}
        >
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} aria-hidden />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="glass relative z-10 flex max-h-[calc(100vh-2rem)] w-full max-w-md flex-col rounded-xl p-6"
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 12 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          >
            {title && <h3 className="mb-3 shrink-0 text-xl font-bold text-ink">{title}</h3>}
            <div className="min-h-0 flex-1 overflow-y-auto pr-0.5 text-ink-soft">{children}</div>
            {footer ? (
              <div className="mt-5 flex shrink-0 justify-end gap-2">{footer}</div>
            ) : (
              <div className="mt-5 flex shrink-0 justify-end">
                <Button variant="secondary" size="sm" onClick={onClose}>
                  关闭
                </Button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
