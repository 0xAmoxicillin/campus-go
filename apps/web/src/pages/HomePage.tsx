import { Link } from 'react-router-dom';
import { Hero3D } from '@/components/common/Hero3D';
import { Container, Section } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { CoverImage } from '@/components/ui/CoverImage';
import { Button } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Motion';
import {
  CalendarIcon,
  MapPinIcon,
  SparkIcon,
  ShieldIcon,
  CompassIcon,
  UserIcon,
  ImageIcon,
} from '@/components/icons';
import { activitiesApi, postsApi } from '@/api';
import { useEffect, useState } from 'react';
import type { ActivityView, PostView } from '@/contracts/api-contract';
import { formatDate } from '@/lib/format';
import { useReducedMotion } from '@/hooks/useReducedMotion';

// 官网增强板块：活动分类标签墙（复用于 /activities 的筛选体验）
const categories = [
  { icon: CompassIcon, label: '探秘漫游', desc: '实验室、博物馆、城市角落' },
  { icon: MapPinIcon, label: '户外骑行', desc: '骑行、徒步、风景同行' },
  { icon: SparkIcon, label: '技能工坊', desc: '代码营、创作营、分享会' },
  { icon: UserIcon, label: '社团巡礼', desc: '社团招新与专场活动' },
  { icon: CalendarIcon, label: '音乐现场', desc: '音乐会、跨年、live house' },
  { icon: ImageIcon, label: '阅读时光', desc: '读书会、讲座、沙龙' },
];

// 参与流程（时间线）
const steps = [
  { title: '注册账号', desc: '用学校邮箱注册，密码满足安全要求即可开启。' },
  { title: '发现活动', desc: '在活动页按关键词或分类筛选，找到心仪的那一场。' },
  { title: '一键报名', desc: '点开详情页「立即报名」，自动去重、名额报满友好提示。' },
  { title: '记录故事', desc: '把参与经历沉淀成资讯与笔记，分享给更多人。' },
];

// 图库拼贴（复用本地 /covers 资源，零外链）
const gallery = [
  'campus-open-day',
  'campus-ride',
  'campus-hack',
  'campus-music',
  'campus-lab',
  'campus-reading',
  'campus-club',
  'campus-scenery',
];

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
  const [totals, setTotals] = useState({ activities: 0, posts: 0 });

  useEffect(() => {
    activitiesApi.list({ pageSize: 3 }).then((r) => setActivities(r.items)).catch(() => {});
    postsApi.list({ pageSize: 3 }).then((r) => setPosts(r.items)).catch(() => {});
    // 统计条只用公开接口可得的数量（活动 / 资讯），避免未登录访问后台接口。
    Promise.all([
      activitiesApi.list({ page: 1, pageSize: 1 }),
      postsApi.list({ page: 1, pageSize: 1 }),
    ])
      .then(([a, p]) => setTotals({ activities: a.total, posts: p.total }))
      .catch(() => {});
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
                  <CoverImage src={a.coverUrl} alt={a.title} className="h-40 w-full object-cover" />
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

      {/* 官网增强①：数据统计条 */}
      <Section>
        <Container>
          <Reveal>
            <div className="grid grid-cols-2 gap-4 rounded-2xl border border-line bg-brand-gradient p-8 text-white sm:grid-cols-4">
              {[
                { value: `${totals.activities}`, label: '精彩活动' },
                { value: `${totals.posts}`, label: '校园资讯' },
                { value: '12', label: '活动分类' },
                { value: '4', label: '参与步骤' },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-3xl font-extrabold tabular-nums sm:text-4xl">{s.value}</p>
                  <p className="mt-1 text-sm text-white/85">{s.label}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </Container>
      </Section>

      {/* 官网增强②：活动分类标签墙 */}
      <Section className="bg-surface-soft/50">
        <Container>
          <Reveal>
            <h2 className="text-2xl font-bold text-ink sm:text-3xl">活动分类</h2>
            <p className="mt-2 max-w-2xl text-ink-soft">总有一类适合你——从实验室到骑行线，从代码营到音乐现场。</p>
          </Reveal>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c, i) => (
              <Reveal key={c.label} delay={i * 0.05}>
                <Card tilt={!reduced} className="h-full p-6">
                  <span className="grid h-11 w-11 place-items-center rounded-lg bg-brand-50 text-brand-700">
                    <c.icon />
                  </span>
                  <h3 className="mt-4 font-semibold text-ink">{c.label}</h3>
                  <p className="mt-2 text-sm text-ink-soft">{c.desc}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* 官网增强③：参与流程时间线 */}
      <Section>
        <Container>
          <Reveal>
            <h2 className="text-2xl font-bold text-ink sm:text-3xl">四步，开启你的校园行</h2>
            <p className="mt-2 max-w-2xl text-ink-soft">从注册到记录，流程简单清晰，新手也能一次上手。</p>
          </Reveal>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.06}>
                <div className="relative h-full rounded-2xl border border-line bg-surface p-6">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-gradient text-lg font-bold text-white">
                    {i + 1}
                  </span>
                  <h3 className="mt-4 font-semibold text-ink">{s.title}</h3>
                  <p className="mt-2 text-sm text-ink-soft">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* 官网增强④：图库拼贴 */}
      <Section className="bg-surface-soft/50">
        <Container>
          <Reveal>
            <h2 className="text-2xl font-bold text-ink sm:text-3xl">校园里的瞬间</h2>
            <p className="mt-2 max-w-2xl text-ink-soft">每一张封面，都是一次真实的出发。</p>
          </Reveal>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {gallery.map((name, i) => (
              <Reveal key={name} delay={i * 0.04}>
                <CoverImage
                  src={`/covers/${name}.webp`}
                  alt="校园行活动封面"
                  className="aspect-[3/2] w-full rounded-xl object-cover shadow-depth-2"
                />
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
