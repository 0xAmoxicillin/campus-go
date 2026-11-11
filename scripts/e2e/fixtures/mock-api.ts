// ---------------------------------------------------------------------------
// API 拦截层（M1 E2E 骨架）
//
// 用 page.route / route.fulfill 把 /api/** 请求替换为符合契约的 fixture。
// M1 后端不实现完整端点，E2E 因此可在无真实后端时本地与 CI 全绿。
//
// 鉴权判定（对齐 docs/api-contract-v0.1.md §1 权限矩阵）：
//   - /api/admin/**  : 无 Bearer → 401/40100；USER 的 Bearer → 403/40300；ADMIN → 200
//   - /api/users/me  : 无 Bearer → 401/40100；有 Bearer → 200
//   - 公开 GET（activities/posts）：无需登录 → 200
//   - auth/register  : 请求体即便带 role 也一律忽略，硬编码 role=USER（安全红线）
//   - auth/login     : 按邮箱前缀区分 ADMIN/USER，用于角色分流骨架
//
// TODO(M3): 删除本拦截层，改打真实服务（baseURL 指向 VITE_API_BASE_URL 对应后端），
//           仅保留 fixtures 作为契约结构回归的参考。
// ---------------------------------------------------------------------------

import type { Page, Route } from '@playwright/test';
import { ErrorCode, RED_LINES, type Role } from '../fixtures/contract';
import {
  adminView,
  authTokens,
  fail,
  ok,
  page as pageData,
  publishedActivity,
  publishedPost,
  userView,
} from '../fixtures/api';

export const API_BASE = 'http://localhost:3001/api';

export type Scenario = 'guest' | 'user' | 'admin';

/** 从 Authorization 头解析出角色（fixture token 前缀即角色） */
function roleFromAuth(auth: string | null): Role | null {
  if (!auth) return null;
  const m = /^Bearer\s+(\S+)$/i.exec(auth);
  if (!m) return null;
  const token = m[1];
  if (token.startsWith('fixture-access-admin')) return 'ADMIN';
  if (token.startsWith('fixture-access-user')) return 'USER';
  return null; // 无效 token 视为未登录
}

function json(route: Route, status: number, body: unknown) {
  return route.fulfill({
    status,
    contentType: 'application/json; charset=utf-8',
    headers: { 'access-control-allow-origin': '*' },
    body: JSON.stringify(body),
  });
}

/**
 * 给页面装上契约 fixture 拦截层。
 * @param scenario 决定 fetch 时携带的 Bearer 身份（guest 不带、user/admin 带对应 token）
 */
export async function installApiMock(page: Page, scenario: Scenario = 'guest') {
  // 为页面发出的 fetch 自动附带 Authorization（模拟前端存储 token 的行为）。
  await page.addInitScript((s: Scenario) => {
    const token =
      s === 'admin' ? 'fixture-access-admin'
      : s === 'user' ? 'fixture-access-user'
      : null;
    const origFetch = window.fetch.bind(window);
    window.fetch = (input: RequestInfo | URL, init: RequestInit = {}) => {
      const headers = new Headers(init.headers);
      if (token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return origFetch(input, { ...init, headers });
    };
  }, scenario);

  await page.route('**/api/**', async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname.replace(/^\/api/, '');
    const method = req.method().toUpperCase();
    const auth = req.headers()['authorization'] ?? null;
    const role = roleFromAuth(auth);

    // ---- 安全红线：管理员后台 /api/admin/** --------------------------------
    if (path.startsWith('/admin/')) {
      if (!role) return json(route, RED_LINES.unauthenticated.http, RED_LINES.unauthenticated.body);
      if (role !== 'ADMIN') return json(route, RED_LINES.forbidden.http, RED_LINES.forbidden.body);
      // ADMIN：返回分页结构（契约 §3.4）
      if (path === '/admin/users' && method === 'GET') {
        return json(route, 200, ok(pageData([userView(), adminView()], 1, 20)));
      }
      if (path === '/admin/activities' && method === 'GET') {
        return json(route, 200, ok(pageData([publishedActivity()], 1, 20)));
      }
      return json(route, 200, ok(null));
    }

    // ---- 安全红线：用户自助 /api/users/me 需登录 ---------------------------
    if (path.startsWith('/users/me')) {
      if (!role) return json(route, RED_LINES.unauthenticated.http, RED_LINES.unauthenticated.body);
      return json(route, 200, ok({ user: role === 'ADMIN' ? adminView() : userView() }));
    }

    // ---- 报名（需登录）------------------------------------------------------
    if (/^\/activities\/[^/]+\/join$/.test(path) && method === 'POST') {
      if (!role) return json(route, RED_LINES.unauthenticated.http, RED_LINES.unauthenticated.body);
      return json(route, 201, ok({ enrollment: { id: 'cuid_enroll_0001', userId: 'cuid_user_0001', activityId: 'cuid_act_0001', createdAt: '2026-11-11T08:00:00.000Z' } }));
    }

    // ---- Auth ---------------------------------------------------------------
    if (path === '/auth/register' && method === 'POST') {
      let payload: Record<string, unknown> = {};
      try { payload = req.postDataJSON() as Record<string, unknown>; } catch { /* 容忍空体 */ }
      // 安全红线：请求体即便带 role 也一律忽略，硬编码 USER。
      void payload.role;
      const u = userView({ email: String(payload.email ?? 'user@campusgo.local'), name: String(payload.name ?? '新用户') });
      return json(route, 201, ok({ user: u, ...authTokens.user }));
    }
    if (path === '/auth/login' && method === 'POST') {
      let payload: Record<string, unknown> = {};
      try { payload = req.postDataJSON() as Record<string, unknown>; } catch { /* 容忍空体 */ }
      const email = String(payload.email ?? '');
      const isAdmin = email.startsWith('admin@');
      const u = isAdmin ? adminView() : userView({ email: email || 'user@campusgo.local' });
      return json(route, 200, ok({ user: u, ...(isAdmin ? authTokens.admin : authTokens.user) }));
    }
    if (path === '/auth/refresh' || path === '/auth/logout') {
      return json(route, 200, ok(path === '/auth/refresh' ? authTokens.user : null));
    }

    // ---- 公开官网内容（无需登录）-------------------------------------------
    if (path === '/activities' && method === 'GET') {
      return json(route, 200, ok(pageData([publishedActivity()], 1, 20)));
    }
    if (/^\/activities\/[^/]+$/.test(path) && method === 'GET') {
      return json(route, 200, ok({ activity: publishedActivity() }));
    }
    if (path === '/posts' && method === 'GET') {
      return json(route, 200, ok(pageData([publishedPost()], 1, 20)));
    }
    if (/^\/posts\/[^/]+$/.test(path) && method === 'GET') {
      return json(route, 200, ok({ post: publishedPost() }));
    }

    // ---- 兜底：40400，仍保持统一响应体形状 ---------------------------------
    return json(route, 404, fail({ code: ErrorCode.NOT_FOUND, message: '资源不存在' }));
  });
}

/** 页面内发起 API 请求并返回解析后的 JSON（供测试断言） */
export async function apiGet(page: Page, path: string): Promise<{ status: number; body: unknown }> {
  return page.evaluate(async ({ base, p }) => {
    const res = await fetch(`${base}${p}`, { headers: { Accept: 'application/json' } });
    const body = await res.json();
    return { status: res.status, body };
  }, { base: API_BASE, p: path });
}

/** 页面内发起带 JSON body 的 API 请求（供注册/登录用例） */
export async function apiPost(page: Page, path: string, payload: unknown): Promise<{ status: number; body: unknown }> {
  return page.evaluate(async ({ base, p, data }) => {
    const res = await fetch(`${base}${p}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(data),
    });
    const body = await res.json();
    return { status: res.status, body };
  }, { base: API_BASE, p: path, data: payload });
}
