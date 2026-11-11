import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Container, Section } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/common/PageHeader';
import { CalendarIcon, MapPinIcon, UserIcon, ArrowRightIcon } from '@/components/icons';
import { activitiesApi } from '@/api';
import { ApiError } from '@/api/errors';
import type { ActivityView } from '@/contracts/api-contract';
import { formatDateTime } from '@/lib/format';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from '@/components/ui/Toast';

export function ActivityDetailPage() {
  const { id = '' } = useParams();
  const [activity, setActivity] = useState<ActivityView | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    setLoading(true);
    activitiesApi
      .get(id)
      .then(setActivity)
      .catch(() => setActivity(null))
      .finally(() => setLoading(false));
  }, [id]);

  async function onJoin() {
    if (!isAuthenticated) {
      toast('请先登录后再报名', 'info');
      return;
    }
    setJoining(true);
    try {
      await activitiesApi.join(id);
      toast('报名成功！我们活动中见 🎉', 'success');
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : '报名失败';
      toast(msg, 'error');
    } finally {
      setJoining(false);
    }
  }

  if (loading) return <Section><Container><EmptyState title="加载中…" /></Container></Section>;
  if (!activity)
    return (
      <Section>
        <Container>
          <EmptyState title="活动不存在或已下架" hint="返回活动列表看看其他行程吧。" />
          <div className="mt-6 text-center">
            <Link to="/activities"><Button variant="outline">返回活动列表</Button></Link>
          </div>
        </Container>
      </Section>
    );

  return (
    <Section>
      <Container className="max-w-3xl">
        <Link to="/activities" className="text-sm text-brand-700 hover:underline">← 活动列表</Link>
        <img src={activity.coverUrl} alt={activity.title} className="mt-4 h-64 w-full rounded-xl object-cover shadow-depth-2" />
        <h1 className="mt-6 text-3xl font-extrabold text-ink">{activity.title}</h1>
        <div className="mt-3 flex flex-wrap gap-4 text-sm text-ink-faint">
          <span className="flex items-center gap-1.5"><CalendarIcon width={16} height={16} /> {formatDateTime(activity.startAt)} – {formatDateTime(activity.endAt)}</span>
          <span className="flex items-center gap-1.5"><MapPinIcon width={16} height={16} /> {activity.location}</span>
          <span className="flex items-center gap-1.5"><UserIcon width={16} height={16} /> 名额 {activity.capacity}</span>
        </div>
        <Card className="mt-6 whitespace-pre-line p-6 text-ink-soft">{activity.content}</Card>
        <div className="mt-6 flex items-center gap-3">
          <Button onClick={onJoin} disabled={joining}>
            {joining ? '报名中…' : '立即报名'} <ArrowRightIcon width={16} height={16} />
          </Button>
          {!isAuthenticated && <span className="text-sm text-ink-faint">登录后报名（体验层提示）</span>}
        </div>
      </Container>
    </Section>
  );
}
