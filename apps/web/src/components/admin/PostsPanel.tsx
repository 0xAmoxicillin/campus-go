import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState, Pagination } from '@/components/common/PageHeader';
import { PlusIcon, PencilIcon, TrashIcon, SearchIcon } from '@/components/icons';
import { PostStatus, type PostView } from '@/contracts/api-contract';
import { adminApi } from '@/api';
import { ApiError } from '@/api/errors';
import { toast } from '@/components/ui/Toast';
import { usePaginatedList } from '@/hooks/usePaginatedList';
import { formatDate } from '@/lib/format';
import { postStatusLabel } from '@/lib/adminForms';
import { PostFormModal } from './PostFormModal';

const statusTone: Record<PostStatus, 'amber' | 'teal' | 'slate'> = {
  DRAFT: 'amber',
  PUBLISHED: 'teal',
  ARCHIVED: 'slate',
};

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 border-b border-line/60 py-3.5">
      <div className="h-12 w-12 shrink-0 animate-pulse rounded-lg bg-surface-soft" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-1/3 animate-pulse rounded bg-surface-soft" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-surface-soft" />
      </div>
      <div className="h-6 w-16 animate-pulse rounded-full bg-surface-soft" />
    </div>
  );
}

export function PostsPanel() {
  const { items, total, page, setPage, query, setQuery, loading, error, reload } = usePaginatedList<PostView>(
    (q) => adminApi.listPosts(q),
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PostView | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<PostView | null>(null);
  const [busyDelete, setBusyDelete] = useState(false);

  const pageItems = useMemo(() => items, [items]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(p: PostView) {
    setEditing(p);
    setFormOpen(true);
  }

  async function handleSubmit(values: Parameters<typeof adminApi.createPost>[0]) {
    setSubmitting(true);
    try {
      if (editing) {
        await adminApi.updatePost(editing.id, values);
        toast('资讯已更新', 'success');
      } else {
        await adminApi.createPost(values);
        toast('资讯已创建', 'success');
      }
      setFormOpen(false);
      reload();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : '保存失败', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setBusyDelete(true);
    try {
      await adminApi.deletePost(deleting.id);
      toast('资讯已删除', 'success');
      setDeleting(null);
      reload();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : '删除失败', 'error');
    } finally {
      setBusyDelete(false);
    }
  }

  async function cycleStatus(p: PostView) {
    const next: PostStatus =
      p.status === PostStatus.DRAFT
        ? PostStatus.PUBLISHED
        : p.status === PostStatus.PUBLISHED
          ? PostStatus.ARCHIVED
          : PostStatus.DRAFT;
    try {
      await adminApi.updatePost(p.id, { status: next });
      toast(`状态已切换为「${postStatusLabel[next]}」`, 'success');
      reload();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : '状态切换失败', 'error');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint">
            <SearchIcon width={16} height={16} />
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索资讯标题 / 摘要"
            className="w-full rounded-lg border border-line bg-surface/70 py-2.5 pl-9 pr-3 text-sm text-ink outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-400/40"
          />
        </div>
        <Button variant="primary" size="sm" onClick={openCreate} className="gap-1.5">
          <PlusIcon width={16} height={16} /> 新建资讯
        </Button>
      </div>

      <Card className="p-4 sm:p-5">
        {error && (
          <div className="mb-4 rounded-lg border border-accent-500/40 bg-accent-500/10 px-4 py-3 text-sm text-accent-600">
            {error}
          </div>
        )}
        {loading ? (
          <div>
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        ) : pageItems.length === 0 ? (
          <EmptyState title="暂无资讯" hint="点击右上角「新建资讯」发布第一条动态。" />
        ) : (
          <ul>
            {pageItems.map((p) => (
              <li
                key={p.id}
                className="flex flex-col gap-3 border-b border-line/60 py-3.5 last:border-b-0 sm:flex-row sm:items-center"
              >
                <img
                  src={p.coverUrl}
                  alt=""
                  loading="lazy"
                  className="h-14 w-14 shrink-0 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold text-ink">{p.title}</p>
                    <StatusBadge tone={statusTone[p.status]}>{postStatusLabel[p.status]}</StatusBadge>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-ink-soft">{p.summary}</p>
                  <p className="mt-0.5 text-2xs text-ink-faint">
                    创建 {formatDate(p.createdAt)}
                    {p.publishedAt ? ` · 发布 ${formatDate(p.publishedAt)}` : ''}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => cycleStatus(p)} title="切换状态">
                    {p.status === PostStatus.DRAFT
                      ? '发布'
                      : p.status === PostStatus.PUBLISHED
                        ? '归档'
                        : '转草稿'}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(p)} className="gap-1">
                    <PencilIcon width={15} height={15} /> 编辑
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleting(p)} className="gap-1 text-accent-600">
                    <TrashIcon width={15} height={15} /> 删除
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {!loading && pageItems.length > 0 && (
          <Pagination page={page} total={total} pageSize={8} onChange={setPage} />
        )}
      </Card>

      <PostFormModal
        open={formOpen}
        post={editing}
        submitting={submitting}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />
      <ConfirmDialog
        open={!!deleting}
        title="删除资讯"
        message={`确定删除「${deleting?.title ?? ''}」？该操作不可撤销。`}
        confirmLabel="删除"
        destructive
        loading={busyDelete}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
