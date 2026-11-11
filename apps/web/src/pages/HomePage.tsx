import { Link } from 'react-router-dom';
import { Hero3D } from '@/components/common/Hero3D';
import { Container, Section } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Motion';
import { CalendarIcon, MapPinIcon, SparkIcon, ShieldIcon, CompassIcon, UserIcon } from '@/components/icons';
import { activitiesApi, postsApi } from '@/api';
import { useEffect, useState } from 'react';
import type { ActivityView, PostView } from '@/contracts/api-contract';
import { formatDate } from '@/lib/format';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const features = [
  { icon: CompassIcon, title: '发现活动', desc: '实验室漫游、城市骑行、通宵代码营——总有一款适合你。' },
  { icon: UserIcon, title: '报名同行', desc: '一键报名，自动去重，名额报满会友好提示。' },
  { icon: SparkIcon, title: '记录轨迹', desc: '把你的校园经历沉淀成一篇篇可分享的故事。' },
  { icon: ShieldIcon, title: '账号安全', desc: 'JWT + 角色分流（USER/ADMIN），越权由后端接口级拦截。' },
];

export function HomePage() {
  const reduced = useReducedMotion();
  const [activities, setActivities] = useState<ActivityView[]>([]);
  const [posts, setPosts] = useState<PostView[]>([]);

  useEffect(() => {
    activitiesApi.list({ pageSize: 3 }).then((r) => setActivities(r.items)).catch(() => {});
    postsApi.list({ pageSize: 3 }).then((r) => setPosts(r.items)).catch(() => {});
  }, []);

  return (
    <>
      <Hero3D />

      <Section>
        <Container>
          <Reveal>
            <h2 className="text-2xl font-bold text-ink sm:text-3xl">为什么是校园行</h2>
            <p className="mt-2 max-w-2xl text-ink-soft">从一个想法到一次出发，我们想把校园生活变得更好玩、更好记。</p>
          </Reveal>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={i * 0.06}>
                <Card tilt={!reduced} className="h-full p-6">
                  <span className="grid h-11 w-11 place-items-center rounded-lg bg-brand-50 text-brand-700">
                    <f.icon />
                  </span>
                  <h3 className="mt-4 font-semibold text-ink">{f.title}</h3>
                  <p className="mt-2 text-sm text-ink-soft">{f.desc}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="bg-surface-soft/50">
        <Container>
          <Reveal>
            <div className="flex items-end justify-between">
              <h2 className="text-2xl font-bold text-ink sm:text-3xl">近期活动</h2>
              <Link to="/activities" className="text-sm font-medium text-brand-700 hover:underline">查看全部 →</Link>
            </div>
          </Reveal>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {activities.map((a, i) => (
              <Reveal key={a.id} delay={i * 0.06}>
                <Card tilt={!reduced} className="overflow-hidden">
                  <img src={a.coverUrl} alt={a.title} loading="lazy" className="h-40 w-full object-cover" />
                  <div className="p-5">
                    <h3 className="font-semibold text-ink">{a.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{a.summary}</p>
                    <div className="mt-3 flex items-center gap-4 text-2xs text-ink-faint">
                      <span className="flex items-center gap-1"><CalendarIcon width={14} height={14} /> {formatDate(a.startAt)}</span>
                      <span className="flex items-center gap-1"><MapPinIcon width={14} height={14} /> {a.location}</span>
                    </div>
                  </div>
                </Card>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <Reveal>
            <div className="flex items-end justify-between">
              <h2 className="text-2xl font-bold text-ink sm:text-3xl">最新资讯</h2>
              <Link to="/posts" className="text-sm font-medium text-brand-700 hover:underline">查看全部 →</Link>
            </div>
          </Reveal>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p, i) => (
              <Reveal key={p.id} delay={i * 0.06}>
                <Card tilt={!reduced} className="p-6">
                  <h3 className="font-semibold text-ink">{p.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{p.summary}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="bg-brand-soft">
        <Container className="text-center">
          <Reveal>
            <h2 className="text-2xl font-bold text-ink sm:text-3xl">准备好出发了吗？</h2>
            <p className="mx-auto mt-2 max-w-xl text-ink-soft">注册一个账号，加入下一次活动，把校园的日子写成故事。</p>
            <div className="mt-6 flex justify-center gap-3">
              <Link to="/register"><Button size="lg">免费注册</Button></Link>
              <Link to="/about"><Button size="lg" variant="outline">了解我们</Button></Link>
            </div>
          </Reveal>
        </Container>
      </Section>
    </>
  );
}
