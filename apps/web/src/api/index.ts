import {
  type ActivityView,
  type AdminUpdateUserRequest,
  type AuthResult,
  type CreateActivityRequest,
  type CreatePostRequest,
  type EnrollmentView,
  type ListQuery,
  type LoginRequest,
  type Paginated,
  type PostView,
  type RefreshRequest,
  type RegisterRequest,
  type UpdateActivityRequest,
  type UpdateMeRequest,
  type UpdatePostRequest,
  type UserView,
} from '@/contracts/api-contract';
import { apiClient } from './apiClient';
import { setTokens, clearTokens, getRefreshToken } from './tokenStore';

// ---------------------------------------------------------------------------
// 按契约 §3 的端点，封装为带类型的函数。
// 仅 M1：默认走 mock adapter；切换后端仅需 VITE_USE_MOCK=false。
// ---------------------------------------------------------------------------

export const authApi = {
  async register(body: RegisterRequest): Promise<AuthResult> {
    const res = await apiClient.request<AuthResult>('/auth/register', { method: 'POST', body });
    setTokens(res.data.accessToken, res.data.refreshToken);
    return res.data;
  },
  async login(body: LoginRequest): Promise<AuthResult> {
    const res = await apiClient.request<AuthResult>('/auth/login', { method: 'POST', body });
    setTokens(res.data.accessToken, res.data.refreshToken);
    return res.data;
  },
  async refresh(): Promise<AuthResult> {
    const refreshToken = getRefreshToken();
    const res = await apiClient.request<AuthResult>('/auth/refresh', {
      method: 'POST',
      body: { refreshToken } satisfies RefreshRequest,
    });
    setTokens(res.data.accessToken, res.data.refreshToken);
    return res.data;
  },
  async logout(): Promise<void> {
    await apiClient.request<null>('/auth/logout', { method: 'POST', body: { refreshToken: getRefreshToken() } });
    clearTokens();
  },
};

export const usersApi = {
  getMe(): Promise<UserView> {
    return apiClient.request<UserView>('/users/me', { method: 'GET', auth: true }).then((r) => r.data);
  },
  updateMe(body: UpdateMeRequest): Promise<UserView> {
    return apiClient.request<UserView>('/users/me', { method: 'PATCH', auth: true, body }).then((r) => r.data);
  },
};

export const activitiesApi = {
  list(query: ListQuery = {}): Promise<Paginated<ActivityView>> {
    const qs = toQuery(query);
    return apiClient.request<Paginated<ActivityView>>(`/activities${qs}`).then((r) => r.data);
  },
  get(id: string): Promise<ActivityView> {
    return apiClient.request<ActivityView>(`/activities/${id}`).then((r) => r.data);
  },
  join(id: string): Promise<EnrollmentView> {
    return apiClient
      .request<EnrollmentView>(`/activities/${id}/join`, { method: 'POST', auth: true })
      .then((r) => r.data);
  },
};

export const postsApi = {
  list(query: ListQuery = {}): Promise<Paginated<PostView>> {
    const qs = toQuery(query);
    return apiClient.request<Paginated<PostView>>(`/posts${qs}`).then((r) => r.data);
  },
  get(id: string): Promise<PostView> {
    return apiClient.request<PostView>(`/posts/${id}`).then((r) => r.data);
  },
};

// 后台（M2：完整 CRUD，真实接口 + mock 回退共用同一份契约形态）。
export const adminApi = {
  listUsers(query: ListQuery = {}): Promise<Paginated<UserView>> {
    const qs = toQuery(query);
    return apiClient.request<Paginated<UserView>>(`/admin/users${qs}`, { method: 'GET', auth: true }).then((r) => r.data);
  },
  updateUser(id: string, body: AdminUpdateUserRequest): Promise<UserView> {
    return apiClient
      .request<UserView>(`/admin/users/${id}`, { method: 'PATCH', auth: true, body })
      .then((r) => r.data);
  },
  listActivities(query: ListQuery = {}): Promise<Paginated<ActivityView>> {
    const qs = toQuery(query);
    return apiClient
      .request<Paginated<ActivityView>>(`/admin/activities${qs}`, { method: 'GET', auth: true })
      .then((r) => r.data);
  },
  createActivity(body: CreateActivityRequest): Promise<ActivityView> {
    return apiClient
      .request<ActivityView>('/admin/activities', { method: 'POST', auth: true, body })
      .then((r) => r.data);
  },
  updateActivity(id: string, body: UpdateActivityRequest): Promise<ActivityView> {
    return apiClient
      .request<ActivityView>(`/admin/activities/${id}`, { method: 'PATCH', auth: true, body })
      .then((r) => r.data);
  },
  deleteActivity(id: string): Promise<void> {
    return apiClient
      .request<null>(`/admin/activities/${id}`, { method: 'DELETE', auth: true })
      .then(() => undefined);
  },
  listPosts(query: ListQuery = {}): Promise<Paginated<PostView>> {
    const qs = toQuery(query);
    return apiClient.request<Paginated<PostView>>(`/admin/posts${qs}`, { method: 'GET', auth: true }).then((r) => r.data);
  },
  createPost(body: CreatePostRequest): Promise<PostView> {
    return apiClient
      .request<PostView>('/admin/posts', { method: 'POST', auth: true, body })
      .then((r) => r.data);
  },
  updatePost(id: string, body: UpdatePostRequest): Promise<PostView> {
    return apiClient
      .request<PostView>(`/admin/posts/${id}`, { method: 'PATCH', auth: true, body })
      .then((r) => r.data);
  },
  deletePost(id: string): Promise<void> {
    return apiClient
      .request<null>(`/admin/posts/${id}`, { method: 'DELETE', auth: true })
      .then(() => undefined);
  },
};

function toQuery(query: ListQuery): string {
  const sp = new URLSearchParams();
  if (query.page != null) sp.set('page', String(query.page));
  if (query.pageSize != null) sp.set('pageSize', String(query.pageSize));
  if (query.q) sp.set('q', query.q);
  if (query.role) sp.set('role', query.role);
  if (query.status) sp.set('status', query.status);
  const s = sp.toString();
  return s ? `?${s}` : '';
}
