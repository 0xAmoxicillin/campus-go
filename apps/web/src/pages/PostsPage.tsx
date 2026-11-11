import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Container, Section } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PageHeader, EmptyState, Pagination } from '@/components/common/PageHeader';
import { Reveal } from '@/components/ui/Motion';
import { ArrowRightIcon } from '@/components/icons';
import { postsApi } from '@/api';
import type { PostView } from '@/contracts/api-contract';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const PAGE_SIZE = 6;

export function PostsPage() {
  const reduced = useReducedMotion();
  const [params, setParams] = useSearchParams();
  const [items, setItems] = useState<PostView[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(Number(params.get('page') ?? 1));
  const [q, setQ] = useState(params.get('q') ?? '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    postsApi
      .list({ page, pageSize: PAGE_SIZE, q: q || undefined })
      .then((r) => {
        setItems(r.items);
        setTotal(r.total);
      })
      .finally(() => setLoading(false));
  }, [page, q]);

  return (
    <>
      <PageHeader title="资讯·动态" subtitle="校园行的产品进展、活动幕后与参与指南。" />
      <Section>
        <Container>
          <div className="mb-8 flex max-w-md">
            <Input placeholder="搜索资讯…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); setParams(e.target.value ? { q: e.target.value } : {}, { replace: true }); }} aria-label="搜索资讯" />
          </div>
          {loading ? (
            <EmptyState title="加载中…" />
          ) : items.length === 0 ? (
            <EmptyState title="暂无匹配的资讯" />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((p, i) => (
                <Reveal key={p.id} delay={i * 0.04}>
                  <Card tilt={!reduced} className="flex h-full flex-col overflow-hidden">
                    <img src={p.coverUrl} alt={p.title} loading="lazy" className="h-40 w-full object-cover" />
                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="font-semibold text-ink">{p.title}</h3>
                      <p className="mt-2 line-clamp-2 flex-1 text-sm text-ink-soft">{p.summary}</p>
                      <Link to={`/posts/${p.id}`} className="mt-4">
                        <Button variant="outline" size="sm" className="w-full">阅读 <ArrowRightIcon width={16} height={16} /></Button>
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
