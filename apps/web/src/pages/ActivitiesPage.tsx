import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Container, Section } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PageHeader, EmptyState, Pagination } from '@/components/common/PageHeader';
import { Reveal } from '@/components/ui/Motion';
import { CalendarIcon, MapPinIcon, ArrowRightIcon } from '@/components/icons';
import { activitiesApi } from '@/api';
import type { ActivityView } from '@/contracts/api-contract';
import { formatDateTime } from '@/lib/format';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const PAGE_SIZE = 6;

export function ActivitiesPage() {
  const reduced = useReducedMotion();
  const [params, setParams] = useSearchParams();
  const [items, setItems] = useState<ActivityView[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(Number(params.get('page') ?? 1));
  const [q, setQ] = useState(params.get('q') ?? '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    activitiesApi
      .list({ page, pageSize: PAGE_SIZE, q: q || undefined })
      .then((r) => {
        setItems(r.items);
        setTotal(r.total);
      })
      .finally(() => setLoading(false));
  }, [page, q]);

  function onSearch(value: string) {
    setQ(value);
    setPage(1);
    setParams(value ? { q: value } : {}, { replace: true });
  }

  return (
    <>
      <PageHeader title="活动·行程" subtitle="公开的校园活动，登录后即可一键报名。" />
      <Section>
        <Container>
          <div className="mb-8 flex max-w-md">
            <Input
              placeholder="搜索活动关键词…"
              value={q}
              onChange={(e) => onSearch(e.target.value)}
              aria-label="搜索活动"
            />
          </div>

          {loading ? (
            <EmptyState title="加载中…" />
          ) : items.length === 0 ? (
            <EmptyState title="暂无匹配的活动" hint="换个关键词，或稍后再来看看。" />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((a, i) => (
                <Reveal key={a.id} delay={i * 0.04}>
                  <Card tilt={!reduced} className="flex h-full flex-col overflow-hidden">
                    <img src={a.coverUrl} alt={a.title} loading="lazy" className="h-44 w-full object-cover" />
                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="text-lg font-semibold text-ink">{a.title}</h3>
                      <p className="mt-2 line-clamp-2 flex-1 text-sm text-ink-soft">{a.summary}</p>
                      <div className="mt-3 flex items-center gap-4 text-2xs text-ink-faint">
                        <span className="flex items-center gap-1"><CalendarIcon width={14} height={14} /> {formatDateTime(a.startAt)}</span>
                        <span className="flex items-center gap-1"><MapPinIcon width={14} height={14} /> {a.location}</span>
                      </div>
                      <Link to={`/activities/${a.id}`} className="mt-4">
                        <Button variant="outline" size="sm" className="w-full">
                          查看详情 <ArrowRightIcon width={16} height={16} />
                        </Button>
                      </Link>
                    </div>
                  </Card>
                </Reveal>
              ))}
            </div>
          )}

          <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} />
        </Container>
      </Section>
    </>
  );
}
