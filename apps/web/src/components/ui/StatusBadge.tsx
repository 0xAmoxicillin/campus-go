import type { ReactNode } from 'react';

type Tone = 'neutral' | 'brand' | 'teal' | 'amber' | 'accent' | 'slate';

const toneCls: Record<Tone, string> = {
  neutral: 'bg-surface-soft text-ink-faint',
  brand: 'bg-brand-50 text-brand-700',
  teal: 'bg-teal-500/15 text-teal-600',
  amber: 'bg-amber-500/15 text-amber-600',
  accent: 'bg-accent-500/15 text-accent-600',
  slate: 'bg-slate-500/15 text-slate-500',
};

/** 统一状态药丸（活动 / 资讯 / 用户状态 / 角色）。 */
export function StatusBadge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-2xs font-semibold ${toneCls[tone]}`}
    >
      {children}
    </span>
  );
}
