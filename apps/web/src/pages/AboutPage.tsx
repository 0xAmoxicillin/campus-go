import { Container, Section } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/common/PageHeader';
import { Reveal } from '@/components/ui/Motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const values = [
  { title: '真实', desc: '只做可参与、能落地的活动，不堆概念。' },
  { title: '轻量', desc: '三步搞定报名，从注册到出发没有多余门槛。' },
  { title: '可记录', desc: '你的校园轨迹，是平台最珍贵的资产。' },
];

export function AboutPage() {
  const reduced = useReducedMotion();
  return (
    <>
      <PageHeader title="关于校园行" subtitle="我们相信，大学最值得回忆的，是那些一起出发的瞬间。" />
      <Section>
        <Container>
          <Reveal>
            <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
              <div>
                <h2 className="text-2xl font-bold text-ink">我们是谁</h2>
                <p className="mt-3 text-ink-soft">
                  校园行 CampusGo 是一个面向在校学生的活动与资讯平台。我们想把散落在各个社团、群聊里的好活动，
                  汇聚成一个你能一眼发现的入口；把报名、同行、记录这些琐碎的环节，做成顺手的体验。
                </p>
                <p className="mt-3 text-ink-soft">
                  从一次实验室漫游，到一场通宵代码营，再到跨年音乐会——我们陪你把每一次出发，都变成可以回看的故事。
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                {values.map((v) => (
                  <Card key={v.title} tilt={!reduced} className="p-5">
                    <h3 className="font-semibold text-brand-700">{v.title}</h3>
                    <p className="mt-1 text-sm text-ink-soft">{v.desc}</p>
                  </Card>
                ))}
              </div>
            </div>
          </Reveal>
        </Container>
      </Section>
    </>
  );
}
