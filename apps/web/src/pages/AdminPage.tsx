import { useEffect, useState } from 'react';
import { AdminSidebar, AdminTopBar, type AdminModule } from '@/components/admin/AdminSidebar';
import { OverviewPanel } from '@/components/admin/OverviewPanel';
import { UsersPanel } from '@/components/admin/UsersPanel';
import { ActivitiesPanel } from '@/components/admin/ActivitiesPanel';
import { PostsPanel } from '@/components/admin/PostsPanel';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from '@/components/ui/Toast';

const titleOf: Record<AdminModule, string> = {
  overview: '概览',
  users: '用户管理',
  activities: '活动管理',
  posts: '资讯管理',
};

/**
 * 后台控制台（M2）：左侧固定导航栏 + 右侧内容区 的 dashboard 布局。
 * 真实后端未起时，列表/写入自动回退 mock（由 VITE_USE_MOCK 控制），不白屏。
 */
export function AdminPage() {
  const [active, setActive] = useState<AdminModule>('overview');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const refreshMe = useAuthStore((s) => s.refreshMe);

  // 进入控制台刷新当前用户（校验 access 是否仍有效，失效则退回登录态）。
  useEffect(() => {
    refreshMe().catch(() => {
      toast('登录状态已失效，请重新登录', 'error');
    });
  }, [refreshMe]);

  function selectModule(m: AdminModule) {
    setActive(m);
    setDrawerOpen(false);
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <AdminTopBar onOpenMenu={() => setDrawerOpen(true)} title={titleOf[active]} />
      <div className="flex flex-1">
        <AdminSidebar active={active} onSelect={selectModule} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            {active === 'overview' && <OverviewPanel onNavigate={selectModule} />}
            {active === 'users' && <UsersPanel />}
            {active === 'activities' && <ActivitiesPanel />}
            {active === 'posts' && <PostsPanel />}
          </div>
        </main>
      </div>
    </div>
  );
}
