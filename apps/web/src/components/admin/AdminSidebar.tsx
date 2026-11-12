import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import {
  LayoutDashboardIcon,
  UserIcon,
  CalendarIcon,
  MailIcon,
  CompassIcon,
  MenuIcon,
  XIcon,
} from '@/components/icons';
import { SunIcon, MoonIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { useThemeStore } from '@/store/useThemeStore';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from '@/components/ui/Toast';
import { LogoutIcon } from '@/components/icons';
import { siteConfig } from '@/config/site';

export type AdminModule = 'overview' | 'users' | 'activities' | 'posts';

const modules: { key: AdminModule; label: string; icon: typeof UserIcon }[] = [
  { key: 'overview', label: '概览', icon: LayoutDashboardIcon },
  { key: 'users', label: '用户管理', icon: UserIcon },
  { key: 'activities', label: '活动管理', icon: CalendarIcon },
  { key: 'posts', label: '资讯管理', icon: MailIcon },
];

interface AdminSidebarProps {
  active: AdminModule;
  onSelect: (m: AdminModule) => void;
  open: boolean;
  onClose: () => void;
}

function NavItems({
  active,
  onSelect,
  onNavigate,
}: {
  active: AdminModule;
  onSelect: (m: AdminModule) => void;
  onNavigate?: () => void;
}) {
  const reduced = useReducedMotion();
  return (
    <nav className="flex flex-col gap-1">
      {modules.map((m) => {
        const isActive = m.key === active;
        return (
          <button
            key={m.key}
            onClick={() => {
              onSelect(m.key);
              onNavigate?.();
            }}
            aria-current={isActive ? 'page' : undefined}
            className={`relative flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none
              ${isActive ? 'text-brand-700' : 'text-ink-soft hover:bg-surface-soft hover:text-ink'}`}
          >
            {isActive && (
              <motion.span
                layoutId="admin-nav-active"
                className="absolute inset-0 -z-10 rounded-lg bg-brand-50"
                transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            <m.icon width={18} height={18} className={isActive ? 'text-brand-700' : 'text-ink-faint'} />
            {m.label}
          </button>
        );
      })}
    </nav>
  );
}

function BrandRow() {
  return (
    <div className="flex items-center gap-2 px-2 pb-2 font-bold text-ink">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-gradient text-white shadow-depth-2">
        <CompassIcon width={18} height={18} />
      </span>
      <span className="text-base">
        {siteConfig.name}<span className="text-brand-600">{siteConfig.nameEn}</span>
      </span>
    </div>
  );
}

/** 顶部栏：品牌 + 主题切换 + 当前用户 + 退出（移动端抽屉触发）。 */
export function AdminTopBar({
  onOpenMenu,
  title,
}: {
  onOpenMenu: () => void;
  title: string;
}) {
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggle);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  async function handleLogout() {
    try {
      await logout();
      toast('已退出登录', 'success');
    } catch {
      toast('退出失败', 'error');
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line/60 bg-surface/70 px-4 backdrop-blur-xl sm:px-6">
      <button
        aria-label="打开菜单"
        onClick={onOpenMenu}
        className="grid h-9 w-9 place-items-center rounded-lg border border-line text-ink-soft md:hidden"
      >
        <MenuIcon width={18} height={18} />
      </button>
      <h1 className="text-lg font-bold text-ink">{title}</h1>
      <div className="ml-auto flex items-center gap-2">
        <button
          aria-label="切换深浅主题"
          onClick={toggleTheme}
          className="grid h-9 w-9 place-items-center rounded-lg border border-line text-ink-soft hover:bg-surface-soft"
        >
          {theme === 'dark' ? <SunIcon width={18} height={18} /> : <MoonIcon width={18} height={18} />}
        </button>
        {user && (
          <span className="hidden items-center gap-2 rounded-lg bg-surface-soft px-2.5 py-1.5 text-sm text-ink-soft sm:flex">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-100 text-brand-700">
              {user.name.slice(0, 1)}
            </span>
            {user.name}
          </span>
        )}
        <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1.5">
          <LogoutIcon width={16} height={16} />
          <span className="hidden sm:inline">退出</span>
        </Button>
      </div>
    </header>
  );
}

/** 左侧固定导航栏（桌面）+ 抽屉（移动端）。 */
export function AdminSidebar({ active, onSelect, open, onClose }: AdminSidebarProps) {
  const user = useAuthStore((s) => s.user);
  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="px-4 pt-5">
        <BrandRow />
      </div>
      <div className="px-3 py-4">
        <NavItems active={active} onSelect={onSelect} />
      </div>
      <div className="mt-auto border-t border-line/60 p-4 text-2xs text-ink-faint">
        {user ? (
          <p>
            当前登录：<span className="text-ink-soft">{user.name}</span>（{user.role}）
          </p>
        ) : (
          <p>未登录</p>
        )}
        <p className="mt-1">前端路由仅做体验分流，越权由后端接口级 Guards 兜底（403）。</p>
      </div>
    </div>
  );

  return (
    <>
      {/* 桌面：固定侧栏 */}
      <aside className="hidden w-64 shrink-0 border-r border-line/60 bg-surface/50 md:block">
        {sidebar}
      </aside>

      {/* 移动端：抽屉 */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} aria-hidden />
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className="glass absolute left-0 top-0 h-full w-64 border-r border-line"
          >
            <button
              aria-label="关闭菜单"
              onClick={onClose}
              className="absolute right-3 top-4 grid h-8 w-8 place-items-center rounded-lg text-ink-soft hover:bg-surface-soft"
            >
              <XIcon width={18} height={18} />
            </button>
            {sidebar}
          </motion.aside>
        </div>
      )}
    </>
  );
}
