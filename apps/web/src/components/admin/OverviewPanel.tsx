import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { UserIcon, CalendarIcon, MailIcon, LayoutDashboardIcon } from '@/components/icons';
import { adminApi } from '@/api';
import { ApiError } from '@/api/errors';
import { toast } from '@/components/ui/Toast';

interface Totals {
  users: number;
  activities: number;
  posts: number;
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
  const [totals, setTotals] = useState<Totals>({ users: 0, activities: 0, posts: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([
      adminApi.listUsers({ page: 1, pageSize: 1 }),
      adminApi.listActivities({ page: 1, pageSize: 1 }),
      adminApi.listPosts({ page: 1, pageSize: 1 }),
    ])
      .then(([u, a, p]) => {
        if (!active) return;
        setTotals({ users: u.total, activities: a.total, posts: p.total });
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

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          icon={<UserIcon width={20} height={20} className="text-brand-700" />}
          label="用户总数"
          value={totals.users}
          loading={loading}
          tone="bg-brand-50"
        />
        <KpiCard
          icon={<CalendarIcon width={20} height={20} className="text-teal-600" />}
          label="活动总数"
          value={totals.activities}
          loading={loading}
          tone="bg-teal-500/15"
        />
        <KpiCard
          icon={<MailIcon width={20} height={20} className="text-accent-600" />}
          label="资讯总数"
          value={totals.posts}
          loading={loading}
          tone="bg-accent-500/15"
        />
      </div>

      <Card className="p-5">
        <div className="flex items-center gap-2 text-ink">
          <LayoutDashboardIcon width={18} height={18} className="text-brand-700" />
          <h2 className="text-lg font-bold">快速入口</h2>
        </div>
        <p className="mt-2 text-sm text-ink-soft">
          使用左侧导航在「用户管理 / 活动管理 / 资讯管理」之间切换；所有写入操作均走真实接口（mock 回退时亦可用）。
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => onNavigate('users')}>
            用户管理
          </Button>
          <Button variant="outline" size="sm" onClick={() => onNavigate('activities')}>
            活动管理
          </Button>
          <Button variant="outline" size="sm" onClick={() => onNavigate('posts')}>
            资讯管理
          </Button>
        </div>
      </Card>
    </div>
  );
}
