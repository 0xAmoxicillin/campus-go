import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { ArrowRightIcon, SparkIcon } from '@/components/icons';

/**
 * 首页 Hero（3D + 视差 + 渐变）。轻量实现，不引 Three.js，避免体积与 License 风险。
 * - 多层景深卡片随滚动视差移动；
 * - 鼠标移动驱动轻微 3D 倾斜（prefers-reduced-motion 降级为静态）。
 */
export function Hero3D() {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const yBack = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : -80]);
  const yMid = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : -30]);
  const yFront = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : 40]);

  return (
    <section ref={ref} className="relative overflow-hidden pt-12 sm:pt-18">
      {/* 背景光斑（多层景深） */}
      <motion.div
        style={{ y: yBack }}
        aria-hidden
        className="pointer-events-none absolute -left-24 top-0 h-96 w-96 rounded-full bg-brand-400/30 blur-3xl"
      />
      <motion.div
        style={{ y: yBack }}
        aria-hidden
        className="pointer-events-none absolute -right-20 top-10 h-96 w-96 rounded-full bg-teal-500/25 blur-3xl"
      />

      <div className="relative mx-auto grid max-w-6xl gap-10 px-5 py-10 sm:px-8 lg:grid-cols-2 lg:items-center">
        <motion.div style={{ y: yMid }} initial={reduced ? {} : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
          <span className="inline-flex items-center gap-2 rounded-full bg-surface/70 px-3 py-1.5 text-2xs font-medium text-brand-700 shadow-depth-1">
            <SparkIcon width={14} height={14} /> 青春校园 × 轻科技
          </span>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight text-ink sm:text-5xl lg:text-6xl">
            把每一次出发
            <br />
            都变成<span className="text-gradient">故事</span>
          </h1>
          <p className="mt-5 max-w-md text-base text-ink-soft">
            校园行 CampusGo 帮你发现好玩的活动、报名同行、记录你的校园轨迹。
            从一个实验室漫游，到一次城市骑行，再到通宵代码营。
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button size="lg" onClick={() => (window.location.href = '/activities')}>
              浏览活动 <ArrowRightIcon width={18} height={18} />
            </Button>
            <Button size="lg" variant="outline" onClick={() => (window.location.href = '/register')}>
              免费注册
            </Button>
          </div>
        </motion.div>

        {/* 3D 倾斜卡片组 */}
        <motion.div
          style={{ y: yFront }}
          className="relative mx-auto h-72 w-full max-w-md [perspective:1200px] sm:h-80"
        >
          <TiltCard reduced={reduced} className="absolute left-0 top-6 rotate-[-8deg]" depth="depth-3">
            <div className="text-2xl font-bold text-gradient">实验室漫游</div>
            <div className="mt-2 text-sm text-ink-faint">11/22 · 校本部理工楼</div>
          </TiltCard>
          <TiltCard reduced={reduced} className="absolute right-0 top-0 rotate-[6deg]" depth="depth-2">
            <div className="text-2xl font-bold text-teal-600">银杏骑行</div>
            <div className="mt-2 text-sm text-ink-faint">11/29 · 15km 轻量</div>
          </TiltCard>
          <TiltCard reduced={reduced} className="absolute bottom-0 left-10 rotate-[2deg]" depth="depth-3">
            <div className="text-2xl font-bold text-accent-500">Hack Night</div>
            <div className="mt-2 text-sm text-ink-faint">12/06 · 通宵组队</div>
          </TiltCard>
        </motion.div>
      </div>
    </section>
  );
}

function TiltCard({
  children,
  className = '',
  reduced,
}: {
  children: React.ReactNode;
  className?: string;
  reduced: boolean;
  depth: string;
}) {
  const r = useRef<HTMLDivElement>(null);
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduced || !r.current) return;
    const rect = r.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    r.current.style.transform = `perspective(900px) rotateX(${-py * 10}deg) rotateY(${px * 10}deg) translateZ(20px)`;
  };
  const onLeave = () => {
    if (r.current) r.current.style.transform = '';
  };
  return (
    <motion.div
      ref={r}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`glass w-56 rounded-xl p-5 ${className}`}
    >
      {children}
    </motion.div>
  );
}
