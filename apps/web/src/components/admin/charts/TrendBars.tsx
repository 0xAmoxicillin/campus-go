interface TrendDatum {
  label: string;
  activities: number;
  posts: number;
}

interface TrendBarsProps {
  data: TrendDatum[];
}

/**
 * 轻量纯 CSS 趋势图（不引外部依赖 / CDN）：近 12 个月活动与资讯新增量对比。
 * 沿用设计系统渐变与字号令牌，自适应宽度（flex 列），高度按最大值归一。
 */
export function TrendBars({ data }: TrendBarsProps) {
  const max = Math.max(1, ...data.map((d) => d.activities + d.posts));
  return (
    <div>
      <div className="flex h-40 items-end gap-1.5">
        {data.map((d) => {
          const total = d.activities + d.posts;
          const h = total === 0 ? null : Math.max(6, Math.round((total / max) * 100));
          return (
            <div key={d.label} className="flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${d.label}：活动 ${d.activities} · 资讯 ${d.posts}`}>
              <span className="text-2xs tabular-nums text-ink-faint">{total || ''}</span>
              <div className="flex w-full flex-1 flex-col-reverse justify-start overflow-hidden rounded-t-md">
                {h !== null && (
                  <div className="w-full" style={{ height: `${h}%` }}>
                    <div className="flex h-full w-full flex-col-reverse">
                      {d.activities > 0 && (
                        <div className="w-full bg-brand-gradient" style={{ height: `${(d.activities / total) * 100}%` }} />
                      )}
                      {d.posts > 0 && (
                        <div className="w-full bg-teal-500/70" style={{ height: `${(d.posts / total) * 100}%` }} />
                      )}
                    </div>
                  </div>
                )}
              </div>
              <span className="text-2xs text-ink-faint">{d.label}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-4 text-2xs text-ink-soft">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-brand-gradient" /> 活动
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-teal-500" /> 资讯
        </span>
      </div>
    </div>
  );
}
