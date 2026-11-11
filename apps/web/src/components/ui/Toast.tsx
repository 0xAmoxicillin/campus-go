import { create } from 'zustand';
import { AnimatePresence, motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

type ToastKind = 'success' | 'error' | 'info';
interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastState {
  toasts: Toast[];
  push: (kind: ToastKind, message: string) => void;
  remove: (id: number) => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (kind, message) => {
    const id = Date.now() + Math.random();
    set({ toasts: [...get().toasts, { id, kind, message }] });
    setTimeout(() => get().remove(id), 3600);
  },
  remove: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

/** 便捷触发函数（在任意组件调用）。 */
export function toast(message: string, kind: ToastKind = 'info') {
  useToastStore.getState().push(kind, message);
}

const kindCls: Record<ToastKind, string> = {
  success: 'border-teal-500/40 text-teal-600',
  error: 'border-accent-500/40 text-accent-600',
  info: 'border-brand-400/40 text-brand-700',
};

/** 设计系统基础组件：Toast（右下角堆叠，a11y role=status）。 */
export function ToastViewport() {
  const { toasts, remove } = useToastStore();
  const reduced = useReducedMotion();
  return (
    <div
      className="fixed bottom-5 right-5 z-[60] flex w-[min(92vw,22rem)] flex-col gap-2"
      role="status"
      aria-live="polite"
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            onClick={() => remove(t.id)}
            className={`glass cursor-pointer rounded-lg border-l-4 px-4 py-3 text-sm font-medium ${kindCls[t.kind]}`}
          >
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
