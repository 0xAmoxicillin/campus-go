// ---------------------------------------------------------------------------
// 越权红线 + 契约结构（M1 E2E 骨架）
//
// 覆盖 docs/api-contract-v0.1.md §1 / §3.4 的两条安全红线：
//   - 未登录访问受保护资源 → HTTP 401 / code=40100
//   - USER 访问 /api/admin/** → HTTP 403 / code=40300
// 并断言统一响应体 {code,message,data} 与分页 {items,total,page,pageSize}。
//
// 全部走 page.route / route.fulfill 拦截层喂入契约 fixture，无真实后端。
// TODO(M3): 删除拦截层，改打真实服务，验证真实 JwtAuthGuard + RolesGuard。
// ---------------------------------------------------------------------------

import { test, expect } from '@playwright/test';
import { ErrorCode, isEnvelope, isPageData, type ApiEnvelope, type PageData } from '../fixtures/contract';
import { apiGet, installApiMock } from '../fixtures/mock-api';

const ADMIN_PATHS = ['/admin/users', '/admin/activities', '/admin/posts'];
const PROTECTED_PATHS = ['/users/me', ...ADMIN_PATHS];

test.describe('统一响应体与分页结构（契约 §0）', () => {
  test('公开活动列表返回 {code,message,data} 且 data 为分页结构', async ({ page }) => {
    await installApiMock(page, 'guest');
    await page.goto('about:blank');

    const { status, body } = await apiGet(page, '/activities');
    expect(status).toBe(200);
    expect(isEnvelope(body)).toBe(true);
    const env = body as ApiEnvelope<PageData>;
    expect(env.code).toBe(ErrorCode.OK);
    expect(env.message).toBe('ok');
    expect(isPageData(env.data)).toBe(true);
    expect(env.data).toEqual(
      expect.objectContaining({ items: expect.any(Array), total: expect.any(Number), page: expect.any(Number), pageSize: expect.any(Number) })
    );
    expect(env.data.pageSize).toBeLessThanOrEqual(100); // 契约：pageSize 上限 100
  });

  test('公开资讯列表同样满足统一响应体与分页结构', async ({ page }) => {
    await installApiMock(page, 'guest');
    await page.goto('about:blank');

    const { status, body } = await apiGet(page, '/posts');
    expect(status).toBe(200);
    expect(isEnvelope(body)).toBe(true);
    expect(isPageData((body as ApiEnvelope).data)).toBe(true);
  });

  test('未知路径的错误响应仍保持 {code,message,data} 形状', async ({ page }) => {
    await installApiMock(page, 'guest');
    await page.goto('about:blank');

    const { status, body } = await apiGet(page, '/does-not-exist');
    expect(status).toBe(404);
    expect(isEnvelope(body)).toBe(true);
    const env = body as ApiEnvelope;
    expect(env.code).toBe(ErrorCode.NOT_FOUND);
    expect(env.data).toBeNull();
  });
});

test.describe('红线一：未登录访问受保护资源 → 401 / code=40100', () => {
  for (const path of PROTECTED_PATHS) {
    test(`guest 访问 ${path} 返回 40100`, async ({ page }) => {
      await installApiMock(page, 'guest');
      await page.goto('about:blank');

      const { status, body } = await apiGet(page, path);
      expect(status).toBe(401);
      expect(isEnvelope(body)).toBe(true);
      const env = body as ApiEnvelope;
      expect(env.code).toBe(ErrorCode.UNAUTHORIZED); // 40100
      expect(env.data).toBeNull();
    });
  }

  test('无效 Bearer token 也按未登录处理（40100）', async ({ page }) => {
    await installApiMock(page, 'guest');
    await page.goto('about:blank');

    const { status, body } = await page.evaluate(async (base) => {
      const res = await fetch(`${base}/users/me`, { headers: { Authorization: 'Bearer garbage' } });
      return { status: res.status, body: await res.json() };
    }, 'http://localhost:3001/api');
    expect(status).toBe(401);
    expect((body as ApiEnvelope).code).toBe(ErrorCode.UNAUTHORIZED);
  });
});

test.describe('红线二：USER 访问 /api/admin/** → 403 / code=40300', () => {
  for (const path of ADMIN_PATHS) {
    test(`USER 访问 ${path} 返回 40300`, async ({ page }) => {
      await installApiMock(page, 'user');
      await page.goto('about:blank');

      const { status, body } = await apiGet(page, path);
      expect(status).toBe(403);
      expect(isEnvelope(body)).toBe(true);
      const env = body as ApiEnvelope;
      expect(env.code).toBe(ErrorCode.FORBIDDEN); // 40300
      expect(env.data).toBeNull();
    });
  }

  test('USER 访问 /users/me 正常（403 仅限 admin 路径）', async ({ page }) => {
    await installApiMock(page, 'user');
    await page.goto('about:blank');

    const { status, body } = await apiGet(page, '/users/me');
    expect(status).toBe(200);
    expect((body as ApiEnvelope).code).toBe(ErrorCode.OK);
  });
});

test.describe('ADMIN 可访问后台且返回分页结构', () => {
  test('ADMIN 访问 /admin/users 返回 0 + 分页 data', async ({ page }) => {
    await installApiMock(page, 'admin');
    await page.goto('about:blank');

    const { status, body } = await apiGet(page, '/admin/users');
    expect(status).toBe(200);
    expect(isEnvelope(body)).toBe(true);
    const env = body as ApiEnvelope<PageData>;
    expect(env.code).toBe(ErrorCode.OK);
    expect(isPageData(env.data)).toBe(true);
  });
});
