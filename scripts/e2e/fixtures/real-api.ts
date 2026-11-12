// ---------------------------------------------------------------------------
// 真实服务 E2E 的 HTTP 客户端（M2）
//
// 用 Playwright 的 APIRequestContext 直接打运行中的 NestJS /api，不经过 page.route
// 拦截层：所有断言针对真实 bcrypt/JWT/Prisma/Guards 链路。
// 契约事实来源：docs/api-contract-v0.1.md（统一响应体 / 错误码 / 分页结构）。
// ---------------------------------------------------------------------------

import type { APIRequestContext, APIResponse } from '@playwright/test';
import { API_BASE } from './real-env';

/** 统一响应体 {code,message,data} —— 契约 §0 */
export interface Envelope<T = unknown> {
  code: number;
  message: string;
  data: T;
}

/** 分页 data {items,total,page,pageSize} —— 契约 §0 */
export interface PageData<T = unknown> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CallResult<T = unknown> {
  status: number;
  body: Envelope<T>;
}

export interface AuthData {
  user: {
    id: string;
    email: string;
    name: string;
    role: 'USER' | 'ADMIN';
    status: 'ACTIVE' | 'DISABLED';
    createdAt: string;
  };
  accessToken: string;
  refreshToken: string;
}

export interface ActivityView {
  id: string;
  title: string;
  summary: string;
  content: string;
  status: string;
  startAt: string;
  endAt: string;
  [k: string]: unknown;
}

export interface PostView {
  id: string;
  title: string;
  status: string;
  [k: string]: unknown;
}

/** 报名视图（契约 §2 / §3.3）；视图层绝不返回 passwordHash。 */
export interface EnrollmentView {
  id: string;
  userId: string;
  activityId: string;
  createdAt: string;
  [k: string]: unknown;
}

/** 错误码（契约 §0）；E2E 只用到其中与红线相关的几个。 */
export const ErrorCode = {
  OK: 0,
  VALIDATION_FAILED: 40001,
  UNAUTHORIZED: 40100,
  BAD_CREDENTIALS: 40102,
  FORBIDDEN: 40300,
  NOT_FOUND: 40400,
  CONFLICT: 40900,
} as const;

/** 断言统一响应体形状（含错误响应）。 */
export function expectEnvelope(v: unknown): asserts v is Envelope {
  if (typeof v !== 'object' || v === null) throw new Error('响应不是对象');
  const o = v as Record<string, unknown>;
  if (typeof o.code !== 'number' || typeof o.message !== 'string' || !('data' in o)) {
    throw new Error(`响应不符合统一响应体 {code,message,data}: ${JSON.stringify(v)}`);
  }
}

/** 断言分页 data 形状。 */
export function expectPageData(v: unknown): asserts v is PageData {
  if (typeof v !== 'object' || v === null) throw new Error('data 不是对象');
  const o = v as Record<string, unknown>;
  if (!Array.isArray(o.items) || typeof o.total !== 'number' || typeof o.page !== 'number' || typeof o.pageSize !== 'number') {
    throw new Error(`data 不符合分页结构 {items,total,page,pageSize}: ${JSON.stringify(v)}`);
  }
}

/**
 * 打真实 API：path 为去掉 /api 前缀的路径，如 '/auth/register'。
 * 返回 HTTP status 与解析后的 JSON（不吞异常，非 JSON 直接抛，便于定位服务未启动）。
 */
export async function call<T = unknown>(
  request: APIRequestContext,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  options: { data?: unknown; token?: string } = {},
): Promise<CallResult<T>> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.data !== undefined) headers['Content-Type'] = 'application/json';
  if (options.token) headers.Authorization = `Bearer ${options.token}`;

  const res: APIResponse = await request.fetch(`${API_BASE}${path}`, {
    method,
    headers,
    data: options.data === undefined ? undefined : JSON.stringify(options.data),
  });
  const text = await res.text();
  let body: Envelope<T>;
  try {
    body = JSON.parse(text) as Envelope<T>;
  } catch {
    throw new Error(`${method} ${path} 返回非 JSON（HTTP ${res.status()}）——服务是否已按 README 启动？响应片段: ${text.slice(0, 200)}`);
  }
  return { status: res.status(), body };
}

/** 注册（仅 USER）；payload 可含 role 用于验证「请求体带 role 一律忽略」红线。 */
export function register(request: APIRequestContext, payload: Record<string, unknown>) {
  return call<AuthData>(request, 'POST', '/auth/register', { data: payload });
}

/** 登录。 */
export function login(request: APIRequestContext, email: string, password: string) {
  return call<AuthData>(request, 'POST', '/auth/login', { data: { email, password } });
}

/** 取当前用户资料（需登录）。 */
export function getMe(request: APIRequestContext, token: string) {
  return call<{ user: AuthData['user'] }>(request, 'GET', '/users/me', { token });
}
