// ---------------------------------------------------------------------------
// 注册 / 登录 / 角色分流（M1 E2E 骨架）
//
// 全部走 page.route / route.fulfill 拦截层喂入契约 fixture，无真实后端。
// 覆盖契约 §1 / §3.1 的安全红线：注册请求体即便带 role 也一律忽略，
// 服务端硬编码 role=USER；初始 ADMIN 只由种子脚本产生，不开放注册。
//
// TODO(M3): 删除拦截层，改打真实 Auth + RBAC 服务，验证真实 JWT 刷新轮换。
// ---------------------------------------------------------------------------

import { test, expect } from '@playwright/test';
import { ErrorCode, isEnvelope, type ApiEnvelope } from '../fixtures/contract';
import { apiPost, installApiMock } from '../fixtures/mock-api';

interface AuthData {
  user: { id: string; email: string; name: string; role: 'USER' | 'ADMIN'; status: string; createdAt: string };
  accessToken: string;
  refreshToken: string;
}

test.describe('注册（POST /api/auth/register）', () => {
  test('注册返回统一响应体 + user 视图 + token，且绝不返回 passwordHash', async ({ page }) => {
    await installApiMock(page, 'guest');
    await page.goto('about:blank');

    const { status, body } = await apiPost(page, '/auth/register', {
      email: 'newuser@campusgo.local',
      password: 'CampusGo2026',
      name: '新用户',
    });
    expect(status).toBe(201);
    expect(isEnvelope(body)).toBe(true);
    const env = body as ApiEnvelope<AuthData>;
    expect(env.code).toBe(ErrorCode.OK);
    expect(env.data.user).toEqual(
      expect.objectContaining({ id: expect.any(String), email: expect.any(String), name: expect.any(String), role: expect.any(String) })
    );
    expect(env.data).toHaveProperty('accessToken');
    expect(env.data).toHaveProperty('refreshToken');
    // 安全红线：user 视图绝不暴露 passwordHash
    expect(JSON.stringify(env.data.user)).not.toContain('passwordHash');
    expect(env.data.user.role).toBe('USER');
  });

  test('安全红线：注册请求体携带 role=ADMIN 一律被忽略，仍得到 USER', async ({ page }) => {
    await installApiMock(page, 'guest');
    await page.goto('about:blank');

    const { status, body } = await apiPost(page, '/auth/register', {
      email: 'attacker@campusgo.local',
      password: 'CampusGo2026',
      name: '提权尝试',
      role: 'ADMIN', // 契约 §1：请求体即便携带 role 也一律忽略/拒绝
    });
    expect(status).toBe(201);
    const env = body as ApiEnvelope<AuthData>;
    expect(env.data.user.role).toBe('USER');
  });
});

test.describe('登录与角色分流（POST /api/auth/login）', () => {
  test('普通用户登录 → role=USER', async ({ page }) => {
    await installApiMock(page, 'guest');
    await page.goto('about:blank');

    const { status, body } = await apiPost(page, '/auth/login', {
      email: 'user@campusgo.local',
      password: 'CampusGo2026',
    });
    expect(status).toBe(200);
    expect(isEnvelope(body)).toBe(true);
    const env = body as ApiEnvelope<AuthData>;
    expect(env.code).toBe(ErrorCode.OK);
    expect(env.data.user.role).toBe('USER');
    expect(env.data.accessToken).toContain('fixture-access-user');
  });

  test('管理员登录 → role=ADMIN', async ({ page }) => {
    await installApiMock(page, 'guest');
    await page.goto('about:blank');

    const { status, body } = await apiPost(page, '/auth/login', {
      email: 'admin@campusgo.local',
      password: 'CampusGo2026',
    });
    expect(status).toBe(200);
    const env = body as ApiEnvelope<AuthData>;
    expect(env.data.user.role).toBe('ADMIN');
    expect(env.data.accessToken).toContain('fixture-access-admin');
  });

  test('角色分流：USER token 无法访问 admin，ADMIN token 可以', async ({ page }) => {
    // 用两个独立 context 模拟不同身份分流（骨架，M3 改为真实页面路由守卫 + 接口守卫）
    await installApiMock(page, 'user');
    await page.goto('about:blank');
    const userRes = await page.evaluate(async (base) => {
      const r = await fetch(`${base}/admin/users`);
      return { status: r.status, body: await r.json() };
    }, 'http://localhost:3001/api');
    expect(userRes.status).toBe(403);
    expect((userRes.body as ApiEnvelope).code).toBe(ErrorCode.FORBIDDEN);

    const adminPage = await page.context().newPage();
    await installApiMock(adminPage, 'admin');
    await adminPage.goto('about:blank');
    const adminRes = await adminPage.evaluate(async (base) => {
      const r = await fetch(`${base}/admin/users`);
      return { status: r.status, body: await r.json() };
    }, 'http://localhost:3001/api');
    expect(adminRes.status).toBe(200);
    expect((adminRes.body as ApiEnvelope).code).toBe(ErrorCode.OK);
  });
});

test.describe('刷新与登出（骨架）', () => {
  test('refresh 返回新 token、logout 返回 data:null，均符合统一响应体', async ({ page }) => {
    await installApiMock(page, 'user');
    await page.goto('about:blank');

    const refresh = await apiPost(page, '/auth/refresh', { refreshToken: 'fixture-refresh-user' });
    expect(refresh.status).toBe(200);
    expect(isEnvelope(refresh.body)).toBe(true);

    const logout = await apiPost(page, '/auth/logout', { refreshToken: 'fixture-refresh-user' });
    expect(logout.status).toBe(200);
    expect((logout.body as ApiEnvelope).data).toBeNull();
  });
});
