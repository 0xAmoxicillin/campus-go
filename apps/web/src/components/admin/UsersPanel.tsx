import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState, Pagination } from '@/components/common/PageHeader';
import { UserIcon, SearchIcon } from '@/components/icons';
import { Role, UserStatus, type UserView } from '@/contracts/api-contract';
import { adminApi } from '@/api';
import { ApiError } from '@/api/errors';
import { toast } from '@/components/ui/Toast';
import { usePaginatedList } from '@/hooks/usePaginatedList';
import { formatDate } from '@/lib/format';

const roleTone: Record<Role, 'brand' | 'neutral'> = {
  ADMIN: 'brand',
  USER: 'neutral',
};

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 border-b border-line/60 py-3.5">
      <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-surface-soft" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-1/4 animate-pulse rounded bg-surface-soft" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-surface-soft" />
      </div>
      <div className="h-6 w-16 animate-pulse rounded-full bg-surface-soft" />
    </div>
  );
}

export function UsersPanel() {
  const { items, total, page, setPage, query, setQuery, loading, error, reload } = usePaginatedList<UserView>(
    (q) => adminApi.listUsers(q),
  );

  const [roleTarget, setRoleTarget] = useState<UserView | null>(null);
  const [busyRole, setBusyRole] = useState(false);

  const pageItems = useMemo(() => items, [items]);

  async function toggleStatus(u: UserView) {
    const next = u.status === UserStatus.ACTIVE ? UserStatus.DISABLED : UserStatus.ACTIVE;
    try {
      await adminApi.updateUser(u.id, { status: next });
      toast(next === UserStatus.ACTIVE ? '用户已启用' : '用户已停用', 'success');
      reload();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : '更新失败', 'error');
    }
  }

  async function confirmRole() {
    if (!roleTarget) return;
    const next = roleTarget.role === Role.ADMIN ? Role.USER : Role.ADMIN;
    setBusyRole(true);
    try {
      await adminApi.updateUser(roleTarget.id, { role: next });
      toast(`已将「${roleTarget.name}」设为${next === Role.ADMIN ? '管理员' : '普通用户'}`, 'success');
      setRoleTarget(null);
      reload();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : '更新失败', 'error');
    } finally {
      setBusyRole(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative w-full sm:max-w-xs">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint">
          <SearchIcon width={16} height={16} />
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索昵称 / 邮箱"
          className="w-full rounded-lg border border-line bg-surface/70 py-2.5 pl-9 pr-3 text-sm text-ink outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-400/40"
        />
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
          <EmptyState title="未找到用户" hint="换个关键词试试。" />
        ) : (
          <ul>
            {pageItems.map((u) => (
              <li
                key={u.id}
                className="flex flex-col gap-3 border-b border-line/60 py-3.5 last:border-b-0 sm:flex-row sm:items-center"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-100 text-brand-700">
                  <UserIcon width={16} height={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold text-ink">{u.name}</p>
                    <StatusBadge tone={roleTone[u.role]}>{u.role}</StatusBadge>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-ink-soft">{u.email}</p>
                  <p className="mt-0.5 text-2xs text-ink-faint">
                    注册于 {formatDate(u.createdAt)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <StatusBadge tone={u.status === UserStatus.ACTIVE ? 'teal' : 'accent'}>
                    {u.status === UserStatus.ACTIVE ? '已启用' : '已停用'}
                  </StatusBadge>
                  <Button variant="outline" size="sm" onClick={() => toggleStatus(u)}>
                    {u.status === UserStatus.ACTIVE ? '停用' : '启用'}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setRoleTarget(u)}>
                    {u.role === Role.ADMIN ? '降为 USER' : '升为 ADMIN'}
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

      <ConfirmDialog
        open={!!roleTarget}
        title="变更用户角色"
        message={`确定将「${roleTarget?.name ?? ''}」${roleTarget?.role === Role.ADMIN ? '降为普通用户' : '提升为管理员'}？`}
        confirmLabel="确认变更"
        loading={busyRole}
        onConfirm={confirmRole}
        onCancel={() => setRoleTarget(null)}
      />
    </div>
  );
}
