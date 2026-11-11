import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState, Pagination } from '@/components/common/PageHeader';
import { PlusIcon, PencilIcon, TrashIcon, SearchIcon } from '@/components/icons';
import { ActivityStatus, type ActivityView } from '@/contracts/api-contract';
import { adminApi } from '@/api';
import { ApiError } from '@/api/errors';
import { toast } from '@/components/ui/Toast';
import { usePaginatedList } from '@/hooks/usePaginatedList';
import { formatDateTime } from '@/lib/format';
import { activityStatusLabel } from '@/lib/adminForms';
import { ActivityFormModal } from './ActivityFormModal';

const statusTone: Record<ActivityStatus, 'amber' | 'teal' | 'slate'> = {
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

export function ActivitiesPanel() {
  const { items, total, page, setPage, query, setQuery, loading, error, reload } = usePaginatedList<
    ActivityView
  >((q) => adminApi.listActivities(q));

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ActivityView | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<ActivityView | null>(null);
  const [busyDelete, setBusyDelete] = useState(false);

  const pageItems = useMemo(() => items, [items]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(a: ActivityView) {
    setEditing(a);
    setFormOpen(true);
  }

  async function handleSubmit(values: Parameters<typeof adminApi.createActivity>[0]) {
    setSubmitting(true);
    try {
      if (editing) {
        await adminApi.updateActivity(editing.id, values);
        toast('活动已更新', 'success');
      } else {
        await adminApi.createActivity(values);
        toast('活动已创建', 'success');
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
      await adminApi.deleteActivity(deleting.id);
      toast('活动已删除', 'success');
      setDeleting(null);
      reload();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : '删除失败', 'error');
    } finally {
      setBusyDelete(false);
    }
  }

  async function cycleStatus(a: ActivityView) {
    const next: ActivityStatus =
      a.status === ActivityStatus.DRAFT
        ? ActivityStatus.PUBLISHED
        : a.status === ActivityStatus.PUBLISHED
          ? ActivityStatus.ARCHIVED
          : ActivityStatus.DRAFT;
    try {
      await adminApi.updateActivity(a.id, { status: next });
      toast(`状态已切换为「${activityStatusLabel[next]}」`, 'success');
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
            placeholder="搜索活动标题 / 摘要"
            className="w-full rounded-lg border border-line bg-surface/70 py-2.5 pl-9 pr-3 text-sm text-ink outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-400/40"
          />
        </div>
        <Button variant="primary" size="sm" onClick={openCreate} className="gap-1.5">
          <PlusIcon width={16} height={16} /> 新建活动
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
          <EmptyState title="暂无活动" hint="点击右上角「新建活动」创建第一条内容。" />
        ) : (
          <ul>
            {pageItems.map((a) => (
              <li
                key={a.id}
                className="flex flex-col gap-3 border-b border-line/60 py-3.5 last:border-b-0 sm:flex-row sm:items-center"
              >
                <img
                  src={a.coverUrl}
                  alt=""
                  loading="lazy"
                  className="h-14 w-14 shrink-0 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold text-ink">{a.title}</p>
                    <StatusBadge tone={statusTone[a.status]}>{activityStatusLabel[a.status]}</StatusBadge>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-ink-soft">{a.summary}</p>
                  <p className="mt-0.5 text-2xs text-ink-faint">
                    {a.location} · {formatDateTime(a.startAt)} → {formatDateTime(a.endAt)} · 容量 {a.capacity}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => cycleStatus(a)} title="切换状态">
                    {a.status === ActivityStatus.DRAFT
                      ? '发布'
                      : a.status === ActivityStatus.PUBLISHED
                        ? '归档'
                        : '转草稿'}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(a)} className="gap-1">
                    <PencilIcon width={15} height={15} /> 编辑
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleting(a)} className="gap-1 text-accent-600">
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

      <ActivityFormModal
        open={formOpen}
        activity={editing}
        submitting={submitting}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />
      <ConfirmDialog
        open={!!deleting}
        title="删除活动"
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
