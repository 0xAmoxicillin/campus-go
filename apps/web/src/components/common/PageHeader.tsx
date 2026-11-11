import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Motion';

/** 内页统一页头（景深 + 渐变标题）。 */
export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="relative overflow-hidden border-b border-line/60 bg-brand-soft">
      <Container className="py-12 sm:py-16">
        <Reveal>
          <h1 className="text-3xl font-extrabold text-ink sm:text-4xl">{title}</h1>
          {subtitle && <p className="mt-3 max-w-2xl text-base text-ink-soft">{subtitle}</p>}
        </Reveal>
      </Container>
    </div>
  );
}

/** 空状态。 */
export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="glass rounded-xl p-10 text-center text-ink-soft">
      <p className="text-lg font-semibold text-ink">{title}</p>
      {hint && <p className="mt-2 text-sm">{hint}</p>}
    </div>
  );
}

/** 分页控件（移动端友好）。 */
export function Pagination({
  page,
  total,
  pageSize,
  onChange,
}: {
  page: number;
  total: number;
  pageSize: number;
  onChange: (p: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      <button
        className="rounded-lg border border-line px-3 py-1.5 text-sm disabled:opacity-40"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
      >
        上一页
      </button>
      <span className="px-2 text-sm text-ink-soft">
        {page} / {pages}
      </span>
      <button
        className="rounded-lg border border-line px-3 py-1.5 text-sm disabled:opacity-40"
        onClick={() => onChange(page + 1)}
        disabled={page >= pages}
      >
        下一页
      </button>
    </div>
  );
}
