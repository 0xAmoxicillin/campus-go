import { useState, type ImgHTMLAttributes } from 'react';
import { siteConfig } from '@/config/site';

interface CoverImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  /** 封面地址（本地 /covers/… 或后端返回的相对/绝对地址）。 */
  src: string;
  /** 无障碍替代文本；卡片图建议传标题，装饰图传空串。 */
  alt: string;
  /** 图片类名（尺寸 / object-fit 等），占位态复用同一组类名以对齐布局。 */
  className?: string;
}

/**
 * 带优雅降级的封面图组件（设计系统）。
 * - 加载失败（外链失效、路径缺失、离线）时，渲染品牌占位块而非裸紫字块。
 * - 占位块沿用传入的 className（高度/圆角/裁切一致），并叠加渐变 + 图标 + 站点名。
 * 仅前端展现，不改变任何业务字段或契约。
 */
export function CoverImage({ src, alt, className = '', ...rest }: CoverImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        role="img"
        aria-label={alt || `${siteConfig.name} 封面`}
        className={`relative flex items-center justify-center overflow-hidden bg-brand-gradient ${className}`}
      >
        <div className="absolute inset-0 opacity-30 [background:radial-gradient(circle_at_30%_20%,white,transparent_45%)]" />
        <div className="relative flex flex-col items-center gap-1 text-white/90">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-5-5L5 21" />
          </svg>
          <span className="text-sm font-semibold tracking-wide">{siteConfig.name} {siteConfig.nameEn}</span>
        </div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={className}
      {...rest}
    />
  );
}
