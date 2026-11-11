import { create } from 'zustand';
import { Role, type UserView } from '@/contracts/api-contract';
import { clearTokens } from '@/api/tokenStore';
import { authApi, usersApi } from '@/api';

interface AuthState {
  user: UserView | null;
  isAuthenticated: boolean;
  /** 体验层角色（仅前端路由分流用；安全边界在后端接口级 Guards）。 */
  role: Role | null;
  login: (email: string, password: string) => Promise<UserView>;
  register: (email: string, password: string, name: string) => Promise<UserView>;
  logout: () => Promise<void>;
  /** 进入受保护页面时刷新当前用户（校验 access 是否仍有效）。 */
  refreshMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  role: null,
  login: async (email, password) => {
    const res = await authApi.login({ email, password });
    set({ user: res.user, isAuthenticated: true, role: res.user.role });
    return res.user;
  },
  register: async (email, password, name) => {
    const res = await authApi.register({ email, password, name });
    set({ user: res.user, isAuthenticated: true, role: res.user.role });
    return res.user;
  },
  logout: async () => {
    await authApi.logout();
    clearTokens();
    set({ user: null, isAuthenticated: false, role: null });
  },
  refreshMe: async () => {
    try {
      const user = await usersApi.getMe();
      set({ user, isAuthenticated: true, role: user.role });
    } catch {
      clearTokens();
      set({ user: null, isAuthenticated: false, role: null });
    }
  },
}));
