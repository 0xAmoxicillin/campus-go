import { Link } from 'react-router-dom';
import { Container } from '@/components/ui/Container';
import { CompassIcon, MailIcon, ShieldIcon } from '@/components/icons';
import { siteConfig } from '@/config/site';

/** 设计系统基础组件：Footer（官网页脚：导航 + 法务 + 安全边界提示）。 */
export function Footer() {
  return (
    <footer className="mt-10 border-t border-line/70 bg-surface-soft/60">
      <Container className="grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 font-bold text-ink">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-gradient text-white">
              <CompassIcon width={18} height={18} />
            </span>
            {siteConfig.name} {siteConfig.nameEn}
          </div>
          <p className="mt-3 text-sm text-ink-faint">
            {siteConfig.slogan}
          </p>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-ink">探索</h4>
          <ul className="space-y-2 text-sm text-ink-soft">
            <li><Link to="/activities" className="hover:text-brand-700">活动·行程</Link></li>
            <li><Link to="/posts" className="hover:text-brand-700">资讯·动态</Link></li>
            <li><Link to="/about" className="hover:text-brand-700">关于{siteConfig.name}</Link></li>
            <li><Link to="/join" className="hover:text-brand-700">加入我们</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-ink">账号</h4>
          <ul className="space-y-2 text-sm text-ink-soft">
            <li><Link to="/login" className="hover:text-brand-700">登录</Link></li>
            <li><Link to="/register" className="hover:text-brand-700">注册</Link></li>
            <li><Link to="/me" className="hover:text-brand-700">我的资料</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-ink">联系</h4>
          <ul className="space-y-2 text-sm text-ink-soft">
            <li className="flex items-center gap-2"><MailIcon width={16} height={16} /> {siteConfig.contactEmail}</li>
          </ul>
        </div>
      </Container>

      <div className="border-t border-line/60">
        <Container className="flex flex-col items-center justify-between gap-2 py-5 text-2xs text-ink-faint sm:flex-row">
          <span>{siteConfig.copyright}</span>
          <span className="flex items-center gap-1.5">
            <ShieldIcon width={14} height={14} /> 接口级鉴权与越权拦截由后端 Guards 兜底，前端路由守卫仅做体验分流
          </span>
        </Container>
      </div>
    </footer>
  );
}
