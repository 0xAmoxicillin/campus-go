import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { CompassIcon, MoonIcon, SunIcon, UserIcon } from '@/components/icons';
import { useThemeStore } from '@/store/useThemeStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const links = [
  { to: '/', label: '首页' },
  { to: '/about', label: '关于校园行' },
  { to: '/activities', label: '活动·行程' },
  { to: '/posts', label: '资讯·动态' },
  { to: '/join', label: '加入我们' },
];

/** 设计系统基础组件：Navbar（玻璃吸顶 + 移动端折叠 + 主题切换 + 登录态）。 */
export function Navbar() {
  const [open, setOpen] = useState(false);
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggle);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.role);
  const reduced = useReducedMotion();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-surface/70 backdrop-blur-xl">
      <Container className="flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-ink">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-gradient text-white shadow-depth-2">
            <CompassIcon />
          </span>
          <span className="text-lg">
            校园行<span className="text-brand-600">CampusGo</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive ? 'text-brand-700 bg-brand-50' : 'text-ink-soft hover:text-ink'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            aria-label="切换深浅主题"
            onClick={toggleTheme}
            className="grid h-9 w-9 place-items-center rounded-lg border border-line text-ink-soft hover:bg-surface-soft"
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
          {isAuthenticated ? (
            <Button variant="secondary" size="sm" onClick={() => navigate(role === 'ADMIN' ? '/admin' : '/me')}>
              <UserIcon width={16} height={16} /> {role === 'ADMIN' ? '控制台' : '我的'}
            </Button>
          ) : (
            <Button variant="primary" size="sm" onClick={() => navigate('/login')}>
              登录
            </Button>
          )}
          <button
            aria-label="菜单"
            className="grid h-9 w-9 place-items-center rounded-lg border border-line text-ink-soft md:hidden"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="text-xl leading-none">≡</span>
          </button>
        </div>
      </Container>

      {open && (
        <motion.nav
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-t border-line/60 bg-surface/90 px-4 py-2 md:hidden"
        >
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm font-medium text-ink-soft hover:bg-surface-soft"
            >
              {l.label}
            </NavLink>
          ))}
        </motion.nav>
      )}
    </header>
  );
}
