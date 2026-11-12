import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  UserIcon,
  CalendarIcon,
  MailIcon,
  LayoutDashboardIcon,
  TrendingUpIcon,
  PieChartIcon,
  ClockIcon,
} from '@/components/icons';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { adminApi } from '@/api';
import { ApiError } from '@/api/errors';
import { toast } from '@/components/ui/Toast';
import { ActivityStatus, PostStatus, type ActivityView, type PostView, type UserView } from '@/contracts/api-contract';
import { formatDate } from '@/lib/format';
import { activityStatusLabel, postStatusLabel } from '@/lib/adminForms';
import { TrendBars } from './charts/TrendBars';
import { StatusDonut } from './charts/StatusDonut';

interface Totals {
  users: number;
  activities: number;
  posts: number;
  publishedActivities: number;
  draftActivities: number;
  archivedActivities: number;
  publishedPosts: number;
  draftPosts: number;
  archivedPosts: number;
}

const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

function monthLabel(iso: string): number {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? -1 : d.getMonth();
}

function KpiCard({
  icon,
  label,
  value,
  loading,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  loading: boolean;
  tone: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <span className={`grid h-11 w-11 place-items-center rounded-xl ${tone}`}>{icon}</span>
        <div>
          <p className="text-sm text-ink-faint">{label}</p>
          <p className="text-2xl font-extrabold text-ink tabular-nums">
            {loading ? <span className="inline-block h-7 w-12 animate-pulse rounded bg-surface-soft" /> : value}
          </p>
        </div>
      </div>
    </Card>
  );
}

export function OverviewPanel({ onNavigate }: { onNavigate: (m: 'users' | 'activities' | 'posts') => void }) {
  const [totals, setTotals] = useState<Totals>({
    users: 0,
    activities: 0,
    posts: 0,
    publishedActivities: 0,
    draftActivities: 0,
    archivedActivities: 0,
    publishedPosts: 0,
    draftPosts: 0,
    archivedPosts: 0,
  });
  const [recentActivities, setRecentActivities] = useState<ActivityView[]>([]);
  const [recentPosts, setRecentPosts] = useState<PostView[]>([]);
  const [recentUsers, setRecentUsers] = useState<UserView[]>([]);
  const [trend, setTrend] = useState<{ label: string; activities: number; posts: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([
      adminApi.listUsers({ page: 1, pageSize: 100 }),
      adminApi.listActivities({ page: 1, pageSize: 100 }),
      adminApi.listPosts({ page: 1, pageSize: 100 }),
    ])
      .then(([u, a, p]) => {
        if (!active) return;
        const act = a.items;
        const posts = p.items;

        // 状态分布
        const t: Totals = {
          users: u.total,
          activities: a.total,
          posts: p.total,
          publishedActivities: act.filter((x) => x.status === ActivityStatus.PUBLISHED).length,
          draftActivities: act.filter((x) => x.status === ActivityStatus.DRAFT).length,
          archivedActivities: act.filter((x) => x.status === ActivityStatus.ARCHIVED).length,
          publishedPosts: posts.filter((x) => x.status === PostStatus.PUBLISHED).length,
          draftPosts: posts.filter((x) => x.status === PostStatus.DRAFT).length,
          archivedPosts: posts.filter((x) => x.status === PostStatus.ARCHIVED).length,
        };
        setTotals(t);

        // 近 12 个月趋势（按创建月份聚合）
        const buckets = MONTHS.map((label) => ({ label, activities: 0, posts: 0 }));
        act.forEach((x) => {
          const m = monthLabel(x.createdAt);
          if (m >= 0) buckets[m].activities += 1;
        });
        posts.forEach((x) => {
          const m = monthLabel(x.createdAt);
          if (m >= 0) buckets[m].posts += 1;
        });
        setTrend(buckets);

        // 最近内容 / 用户
        setRecentActivities([...act].sort((x, y) => +new Date(y.createdAt) - +new Date(x.createdAt)).slice(0, 5));
        setRecentPosts([...posts].sort((x, y) => +new Date(y.createdAt) - +new Date(x.createdAt)).slice(0, 5));
        setRecentUsers(
          [...u.items].sort((x, y) => +new Date(y.createdAt) - +new Date(x.createdAt)).slice(0, 5),
        );
      })
      .catch((e) => {
        if (!active) return;
        toast(e instanceof ApiError ? e.message : '概览加载失败', 'error');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const activitySlices = [
    { label: activityStatusLabel[ActivityStatus.PUBLISHED], value: totals.publishedActivities, color: 'rgb(var(--teal-500))' },
    { label: activityStatusLabel[ActivityStatus.DRAFT], value: totals.draftActivities, color: 'rgb(var(--accent-500))' },
    { label: activityStatusLabel[ActivityStatus.ARCHIVED], value: totals.archivedActivities, color: 'rgb(var(--ink-faint))' },
  ];
  const postSlices = [
    { label: postStatusLabel[PostStatus.PUBLISHED], value: totals.publishedPosts, color: 'rgb(var(--teal-500))' },
    { label: postStatusLabel[PostStatus.DRAFT], value: totals.draftPosts, color: 'rgb(var(--accent-500))' },
    { label: postStatusLabel[PostStatus.ARCHIVED], value: totals.archivedPosts, color: 'rgb(var(--ink-faint))' },
  ];

  return (
    <div className="space-y-5">
      {/* KPI 行 */}
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard icon={<UserIcon width={20} height={20} className="text-brand-700" />} label="用户总数" value={totals.users} loading={loading} tone="bg-brand-50" />
        <KpiCard icon={<CalendarIcon width={20} height={20} className="text-teal-600" />} label="活动总数" value={totals.activities} loading={loading} tone="bg-teal-500/15" />
        <KpiCard icon={<MailIcon width={20} height={20} className="text-accent-600" />} label="资讯总数" value={totals.posts} loading={loading} tone="bg-accent-500/15" />
      </div>

      {/* 趋势 + 分布 */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center gap-2 text-ink">
            <TrendingUpIcon width={18} height={18} className="text-brand-700" />
            <h2 className="text-lg font-bold">近 12 个月新增趋势</h2>
          </div>
          <p className="mt-1 text-xs text-ink-faint">按创建月份聚合的活动与资讯数量（mock / 真实后端同源数据）。</p>
          <div className="mt-4">
            {loading ? <div className="h-40 animate-pulse rounded-lg bg-surface-soft" /> : <TrendBars data={trend} />}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 text-ink">
            <PieChartIcon width={18} height={18} className="text-brand-700" />
            <h2 className="text-lg font-bold">状态分布</h2>
          </div>
          <div className="mt-4 space-y-4">
            <div>
              <p className="mb-2 text-xs font-medium text-ink-soft">活动</p>
              {loading ? <div className="h-28 animate-pulse rounded-lg bg-surface-soft" /> : <StatusDonut slices={activitySlices} />}
            </div>
            <div className="border-t border-line/60 pt-3">
              <p className="mb-2 text-xs font-medium text-ink-soft">资讯</p>
              {loading ? <div className="h-28 animate-pulse rounded-lg bg-surface-soft" /> : <StatusDonut slices={postSlices} />}
            </div>
          </div>
        </Card>
      </div>

      {/* 最近列表 */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-ink">
              <ClockIcon width={18} height={18} className="text-brand-700" />
              <h2 className="text-lg font-bold">最近活动</h2>
            </div>
            <Button variant="outline" size="sm" onClick={() => onNavigate('activities')}>查看全部</Button>
          </div>
          <ul className="mt-3 divide-y divide-line/60">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <li key={i} className="h-10 animate-pulse rounded bg-surface-soft" />)
            ) : recentActivities.length === 0 ? (
              <li className="py-4 text-sm text-ink-faint">暂无活动</li>
            ) : (
              recentActivities.map((a) => (
                <li key={a.id} className="flex items-center gap-3 py-2.5">
                  <span className="min-w-0 flex-1 truncate font-medium text-ink">{a.title}</span>
                  <StatusBadge tone={a.status === ActivityStatus.PUBLISHED ? 'teal' : a.status === ActivityStatus.DRAFT ? 'amber' : 'slate'}>
                    {activityStatusLabel[a.status]}
                  </StatusBadge>
                  <span className="hidden text-2xs text-ink-faint sm:block">{formatDate(a.createdAt)}</span>
                </li>
              ))
            )}
          </ul>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-ink">
              <ClockIcon width={18} height={18} className="text-brand-700" />
              <h2 className="text-lg font-bold">最近资讯</h2>
            </div>
            <Button variant="outline" size="sm" onClick={() => onNavigate('posts')}>查看全部</Button>
          </div>
          <ul className="mt-3 divide-y divide-line/60">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <li key={i} className="h-10 animate-pulse rounded bg-surface-soft" />)
            ) : recentPosts.length === 0 ? (
              <li className="py-4 text-sm text-ink-faint">暂无资讯</li>
            ) : (
              recentPosts.map((p) => (
                <li key={p.id} className="flex items-center gap-3 py-2.5">
                  <span className="min-w-0 flex-1 truncate font-medium text-ink">{p.title}</span>
                  <StatusBadge tone={p.status === PostStatus.PUBLISHED ? 'teal' : p.status === PostStatus.DRAFT ? 'amber' : 'slate'}>
                    {postStatusLabel[p.status]}
                  </StatusBadge>
                  <span className="hidden text-2xs text-ink-faint sm:block">{formatDate(p.createdAt)}</span>
                </li>
              ))
            )}
          </ul>
        </Card>
      </div>

      {/* 最近用户 + 快速入口 */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-ink">
              <UserIcon width={18} height={18} className="text-brand-700" />
              <h2 className="text-lg font-bold">最近注册用户</h2>
            </div>
            <Button variant="outline" size="sm" onClick={() => onNavigate('users')}>查看全部</Button>
          </div>
          <ul className="mt-3 divide-y divide-line/60">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <li key={i} className="h-10 animate-pulse rounded bg-surface-soft" />)
            ) : recentUsers.length === 0 ? (
              <li className="py-4 text-sm text-ink-faint">暂无用户</li>
            ) : (
              recentUsers.map((u) => (
                <li key={u.id} className="flex items-center gap-3 py-2.5">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700">
                    <UserIcon width={16} height={16} />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-ink">{u.name}</span>
                  <span className="hidden truncate text-2xs text-ink-faint sm:block">{u.email}</span>
                  <span className="text-2xs text-ink-faint">{u.role === 'ADMIN' ? '管理员' : '用户'}</span>
                  <span className="text-2xs text-ink-faint">{formatDate(u.createdAt)}</span>
                </li>
              ))
            )}
          </ul>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 text-ink">
            <LayoutDashboardIcon width={18} height={18} className="text-brand-700" />
            <h2 className="text-lg font-bold">快速入口</h2>
          </div>
          <p className="mt-2 text-sm text-ink-soft">
            使用左侧导航在「用户管理 / 活动管理 / 资讯管理」之间切换；所有写入操作均走真实接口（mock 回退时亦可用）。
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => onNavigate('users')}>用户管理</Button>
            <Button variant="outline" size="sm" onClick={() => onNavigate('activities')}>活动管理</Button>
            <Button variant="outline" size="sm" onClick={() => onNavigate('posts')}>资讯管理</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
