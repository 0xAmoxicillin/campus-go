interface Slice {
  label: string;
  value: number;
  color: string;
}

interface StatusDonutProps {
  slices: Slice[];
}

/**
 * 轻量纯 SVG 环形图（不引外部依赖 / CDN）：展示活动 / 资讯的状态分布。
 * 用 conic-style 的 SVG 描边圆弧实现，无 JS 图表库。
 */
export function StatusDonut({ slices }: StatusDonutProps) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  const R = 42;
  const C = 2 * Math.PI * R;
  let offset = 0;

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 100 100" className="h-28 w-28 shrink-0 -rotate-90" role="img" aria-label="状态分布环形图">
        <circle cx="50" cy="50" r={R} fill="none" stroke="rgb(var(--line))" strokeWidth="12" />
        {total > 0 &&
          slices.map((s) => {
            const len = (s.value / total) * C;
            const el = (
              <circle
                key={s.label}
                cx="50"
                cy="50"
                r={R}
                fill="none"
                stroke={s.color}
                strokeWidth="12"
                strokeDasharray={`${len} ${C - len}`}
                strokeDashoffset={-offset}
              />
            );
            offset += len;
            return el;
          })}
        <text x="50" y="50" textAnchor="middle" dominantBaseline="central" className="rotate-90 fill-ink text-[15px] font-bold" style={{ transformOrigin: '50px 50px' }}>
          {total}
        </text>
      </svg>
      <ul className="space-y-1.5 text-sm">
        {slices.map((s) => (
          <li key={s.label} className="flex items-center gap-2 text-ink-soft">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
            {s.label}
            <span className="ml-auto tabular-nums text-ink-faint">{s.value}</span>
          </li>
        ))}
        {slices.length === 0 && <li className="text-ink-faint">暂无数据</li>}
      </ul>
    </div>
  );
}
