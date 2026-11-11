// ---------------------------------------------------------------------------
// 契约 fixture（M1 E2E 骨架）
//
// 事实来源：docs/api-contract-v0.1.md（统一接口契约，契约唯一事实来源）
// 本文件只提供「符合契约形状的假数据」，供 page.route / route.fulfill 拦截层
// 喂给页面；M1 后端不实现完整端点，E2E 因此可在无真实后端时本地与 CI 全绿。
//
// TODO(M3): 后端 Auth/RBAC/Admin 接口就绪后，删除拦截层，改为打真实服务，
//           fixture 仅保留用于「契约结构回归」的纯断言参考。
// ---------------------------------------------------------------------------

import type { ErrorLike } from './contract';

/** 统一成功响应体 {code, message, data} —— 契约 §0 */
export function ok<T>(data: T): { code: number; message: string; data: T } {
  return { code: 0, message: 'ok', data };
}

/** 统一错误响应体 {code, message, data:null} —— 契约 §0 / 错误码表 */
export function fail(error: ErrorLike): { code: number; message: string; data: null } {
  return { code: error.code, message: error.message, data: null };
}

/** 分页 data 结构 {items,total,page,pageSize} —— 契约 §0 */
export function page<T>(items: T[], page = 1, pageSize = 20) {
  return { items, total: items.length, page, pageSize };
}

/** 用户视图 {id,email,name,role,status,createdAt} —— 绝不返回 passwordHash（契约 §3.1） */
export const userView = (overrides: Partial<{
  id: string; email: string; name: string; role: 'USER' | 'ADMIN';
  status: 'ACTIVE' | 'DISABLED'; createdAt: string;
}> = {}) => ({
  id: 'cuid_user_0001',
  email: 'user@campusgo.local',
  name: '校园用户',
  role: 'USER' as const,
  status: 'ACTIVE' as const,
  createdAt: '2026-11-11T08:00:00.000Z',
  ...overrides,
});

export const adminView = () =>
  userView({
    id: 'cuid_admin_0001',
    email: 'admin@campusgo.local',
    name: '管理员',
    role: 'ADMIN',
  });

/** 活动（仅 PUBLISHED 出现在公开列表）—— 契约 §2 / §3.3 */
export const publishedActivity = (overrides: Record<string, unknown> = {}) => ({
  id: 'cuid_act_0001',
  title: '校园迎新跑',
  summary: '环校 5km 晨跑',
  content: '一年一度的迎新跑，欢迎报名。',
  coverUrl: 'https://example.invalid/cover.png',
  location: '操场',
  startAt: '2026-11-20T07:00:00.000Z',
  endAt: '2026-11-20T09:00:00.000Z',
  capacity: 100,
  status: 'PUBLISHED',
  createdById: 'cuid_admin_0001',
  createdAt: '2026-11-11T08:00:00.000Z',
  updatedAt: '2026-11-11T08:00:00.000Z',
  ...overrides,
});

/** 资讯（仅 PUBLISHED 出现在公开列表）—— 契约 §2 / §3.3 */
export const publishedPost = (overrides: Record<string, unknown> = {}) => ({
  id: 'cuid_post_0001',
  title: '校园行第一期内测公告',
  summary: '内测版本说明',
  content: '本次内测开放注册与登录。',
  coverUrl: 'https://example.invalid/post.png',
  status: 'PUBLISHED',
  createdById: 'cuid_admin_0001',
  createdAt: '2026-11-11T08:00:00.000Z',
  updatedAt: '2026-11-11T08:00:00.000Z',
  publishedAt: '2026-11-11T08:00:00.000Z',
  ...overrides,
});

/** token 集合（auth 出参 data）—— 契约 §3.1 */
export const authTokens = {
  user: { accessToken: 'fixture-access-user', refreshToken: 'fixture-refresh-user' },
  admin: { accessToken: 'fixture-access-admin', refreshToken: 'fixture-refresh-admin' },
};
