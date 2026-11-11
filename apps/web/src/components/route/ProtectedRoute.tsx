import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Role } from '@/contracts/api-contract';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from '@/components/ui/Toast';

/**
 * ⚠️ 安全边界声明（docs/api-contract-v0.1.md §1 / collaboration-v0.1.md §4）：
 * 前端路由守卫只做「体验层」分流（未登录跳登录、非 ADMIN 提示无权限），
 * **不是** 安全边界。真正的鉴权与越权拦截由后端接口级 JwtAuthGuard + RolesGuard 兜底，
 * USER 访问 /api/admin/** 一律返回 403（code=40300）。请勿在前端依赖本守卫做权限判断。
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    // 记录来源，登录后可回跳（体验层，不涉及安全）。
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return <>{children}</>;
}

/** 仅 ADMIN 可进入的控制台守卫：非 ADMIN 给出无权限提示并留在原地。 */
export function AdminRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.role);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  if (role !== Role.ADMIN) {
    // RBAC 红线（体验层）：提示无权限，不渲染控制台。
    return <ForbiddenNotice />;
  }
  return <>{children}</>;
}

function ForbiddenNotice() {
  // 越权提示（与后端 40300 语义对应，体验层提示）。
  useEffect(() => {
    toast('无权限：仅管理员可访问控制台（接口级越权由后端拦截 403）', 'error');
  }, []);
  return (
    <div className="mx-auto max-w-md px-5 py-24 text-center">
      <div className="text-6xl font-extrabold text-accent-500">403</div>
      <h1 className="mt-4 text-2xl font-bold text-ink">无权限访问</h1>
      <p className="mt-2 text-ink-soft">
        控制台仅限管理员（ADMIN）。你当前是普通用户（USER）。
        注意：前端提示仅做体验分流，真正的越权拦截由后端接口级 Guards 兜底（返回 403 / code=40300）。
      </p>
    </div>
  );
}
