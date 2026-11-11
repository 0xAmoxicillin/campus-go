import { Link } from 'react-router-dom';
import { Container, Section } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/common/PageHeader';
import { Reveal } from '@/components/ui/Motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const steps = [
  { n: 1, title: '用学校邮箱注册', desc: '密码需 ≥8 位且含大小写字母与数字。注册一律为普通用户（USER）。' },
  { n: 2, title: '浏览并报名活动', desc: '在活动列表找到心仪的行程，一键报名，自动去重。' },
  { n: 3, title: '记录你的轨迹', desc: '把校园里的每一次出发，沉淀成可分享的故事。' },
];

export function JoinPage() {
  const reduced = useReducedMotion();
  return (
    <>
      <PageHeader title="加入我们" subtitle="三步开启你的校园行，账号免费、门槛极低。" />
      <Section>
        <Container>
          <div className="grid gap-5 sm:grid-cols-3">
            {steps.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.06}>
                <Card tilt={!reduced} className="h-full p-6">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand-gradient text-lg font-bold text-white">{s.n}</div>
                  <h3 className="mt-4 font-semibold text-ink">{s.title}</h3>
                  <p className="mt-2 text-sm text-ink-soft">{s.desc}</p>
                </Card>
              </Reveal>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link to="/register"><Button size="lg">立即注册</Button></Link>
          </div>
        </Container>
      </Section>
    </>
  );
}
