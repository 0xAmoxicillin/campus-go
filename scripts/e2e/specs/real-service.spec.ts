// ---------------------------------------------------------------------------
// M2 真实服务 E2E（Playwright）
//
// 与 M1 的 page.route 拦截层不同，本文件打的是**运行中的真实服务**：
//   PostgreSQL 16 → prisma migrate deploy → seed 管理员 → NestJS(3001) → Vite(5173)
// 覆盖：注册(USER) / 登录 / 角色分流 / 越权 401(未登录) · 403(USER 访问 /api/admin/**)
//       / 用户启停 / 活动·资讯 CRUD / 统一响应体与分页结构 / 前端页面可达与角色分流。
//
// 运行前提（详见 README「本地启动与验证」）：
//   E2E_MODE=real ADMIN_SEED_PASSWORD=<.env 中的值> pnpm run test:e2e:real
// CI 中由 ci.yml 的 postgres service 容器 + 前置步骤注入这些环境变量并起服务；
// 本地若无 PG / 未起服务，请按 README 配置，本套件不会伪装通过。
//
// 契约事实来源：docs/api-contract-v0.1.md（受控文档，本批不改）。
// ---------------------------------------------------------------------------

import { test, expect, type APIRequestContext } from '@playwright/test';
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  ENTRY_URL,
  REAL_MODE,
  TEST_PASSWORD,
  uniqueEmail,
} from '../fixtures/real-env';
import {
  call,
  ErrorCode,
  expectEnvelope,
  expectPageData,
  getMe,
  login,
  register,
  type ActivityView,
  type AuthData,
  type PageData,
  type PostView,
} from '../fixtures/real-api';

// 只有显式 E2E_MODE=real 时执行；默认 `pnpm run test:e2e` 仍跑 M1 契约结构回归，
// 互不干扰，也不会在无真实服务时伪装全绿。
test.skip(!REAL_MODE, '真实服务 E2E 需要 E2E_MODE=real + 已启动的 PG16/server/web（见 README）');

test.describe.configure({ mode: 'serial' });

/** 前置：种子管理员口令必须注入（与 seed 脚本一致），否则给出清晰提示。 */
test.beforeAll(() => {
  if (!ADMIN_PASSWORD) {
    throw new Error(
      '缺少 ADMIN_SEED_PASSWORD：真实服务 E2E 需要种子管理员口令。' +
        ' 本地按 .env.example 配置 .env 后运行 `pnpm run test:e2e:real`；CI 由 ci.yml 注入。' +
        ' 该值绝不写进仓库。',
    );
  }
});

interface Session {
  email: string;
  accessToken: string;
  refreshToken: string;
  user: AuthData['user'];
}

/** 注册一个新 USER 并返回会话（每次唯一邮箱，避免 409）。 */
async function newUser(request: APIRequestContext, prefix = 'user'): Promise<Session> {
  const email = uniqueEmail(prefix);
  const res = await register(request, { email, password: TEST_PASSWORD, name: 'E2E 测试用户' });
  expect(res.status).toBe(201);
  expectEnvelope(res.body);
  expect(res.body.code).toBe(ErrorCode.OK);
  const data = res.body.data as AuthData;
  expect(data.user.email).toBe(email);
  expect(data.user.role).toBe('USER');
  expect(data.accessToken).toEqual(expect.any(String));
  expect(data.refreshToken).toEqual(expect.any(String));
  // 安全红线：user 视图绝不返回 passwordHash
  expect(JSON.stringify(data.user)).not.toContain('passwordHash');
  return {
    email,
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    user: data.user,
  };
}

/** 管理员登录（种子账号）。 */
async function adminSession(request: APIRequestContext): Promise<Session> {
  const res = await login(request, ADMIN_EMAIL, ADMIN_PASSWORD);
  expect(res.status).toBe(200);
  expectEnvelope(res.body);
  expect(res.body.code).toBe(ErrorCode.OK);
  const data = res.body.data as AuthData;
  expect(data.user.role).toBe('ADMIN');
  expect(JSON.stringify(data.user)).not.toContain('passwordHash');
  return {
    email: ADMIN_EMAIL,
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    user: data.user,
  };
}

// ---------------------------------------------------------------------------
// 1. 注册 / 登录 / 角色分流
// ---------------------------------------------------------------------------

test.describe('真实 Auth：注册 / 登录 / 角色分流', () => {
  test('注册返回统一响应体 + user 视图 + token，且绝不返回 passwordHash', async ({ request }) => {
    await newUser(request, 'register');
  });

  test('安全红线：注册请求体携带 role=ADMIN 一律被忽略，仍得到 USER', async ({ request }) => {
    const email = uniqueEmail('escalate');
    const res = await register(request, {
      email,
      password: TEST_PASSWORD,
      name: '提权尝试',
      role: 'ADMIN', // 契约 §1：请求体即便携带 role 也一律忽略/拒绝
    });
    expect(res.status).toBe(201);
    expectEnvelope(res.body);
    expect((res.body.data as AuthData).user.role).toBe('USER');
  });

  test('普通用户可用注册邮箱登录，返回 role=USER', async ({ request }) => {
    const u = await newUser(request, 'login');
    const res = await login(request, u.email, TEST_PASSWORD);
    expect(res.status).toBe(200);
    expectEnvelope(res.body);
    expect((res.body.data as AuthData).user.role).toBe('USER');
  });

  test('种子管理员登录返回 role=ADMIN，且响应体不泄露哈希', async ({ request }) => {
    await adminSession(request);
  });

  test('GET /users/me 携带 USER token 返回当前用户（统一响应体）', async ({ request }) => {
    const u = await newUser(request, 'me');
    const res = await getMe(request, u.accessToken);
    expect(res.status).toBe(200);
    expectEnvelope(res.body);
    expect(res.body.code).toBe(ErrorCode.OK);
    expect((res.body.data as { user: AuthData['user'] }).user.email).toBe(u.email);
  });
});

// ---------------------------------------------------------------------------
// 2. 越权红线：401（未登录）/ 403（USER 访问 /api/admin/**）
// ---------------------------------------------------------------------------

test.describe('真实 RBAC 红线：401 / 403', () => {
  const ADMIN_PATHS = ['/admin/users', '/admin/activities', '/admin/posts'];

  for (const path of [...ADMIN_PATHS, '/users/me']) {
    test(`未登录访问 ${path} → HTTP 401 / code=40100`, async ({ request }) => {
      const res = await call(request, 'GET', path);
      expect(res.status).toBe(401);
      expectEnvelope(res.body);
      expect(res.body.code).toBe(ErrorCode.UNAUTHORIZED);
      expect(res.body.data).toBeNull();
    });
  }

  test('无效 Bearer token 按未登录处理（401 / 40100）', async ({ request }) => {
    const res = await call(request, 'GET', '/users/me', { token: 'this-is-not-a-jwt' });
    expect(res.status).toBe(401);
    expectEnvelope(res.body);
    expect(res.body.code).toBe(ErrorCode.UNAUTHORIZED);
  });

  for (const path of ADMIN_PATHS) {
    test(`USER 访问 ${path} → HTTP 403 / code=40300`, async ({ request }) => {
      const u = await newUser(request, 'forbid');
      const res = await call(request, 'GET', path, { token: u.accessToken });
      expect(res.status).toBe(403);
      expectEnvelope(res.body);
      expect(res.body.code).toBe(ErrorCode.FORBIDDEN);
      expect(res.body.data).toBeNull();
    });
  }

  test('USER 访问 /users/me 正常（403 仅限 admin 路径）', async ({ request }) => {
    const u = await newUser(request, 'self');
    const res = await getMe(request, u.accessToken);
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(ErrorCode.OK);
  });
});

// ---------------------------------------------------------------------------
// 3. 统一响应体与分页结构（真实数据）
// ---------------------------------------------------------------------------

test.describe('契约 §0：统一响应体与分页结构', () => {
  test('公开 GET /activities 返回 code=0 且 data 为分页结构', async ({ request }) => {
    const res = await call<PageData<ActivityView>>(request, 'GET', '/activities');
    expect(res.status).toBe(200);
    expectEnvelope(res.body);
    expect(res.body.code).toBe(ErrorCode.OK);
    expect(res.body.message).toEqual(expect.any(String));
    expectPageData(res.body.data);
    expect(res.body.data.pageSize).toBeLessThanOrEqual(100);
  });

  test('公开 GET /posts 返回 code=0 且 data 为分页结构', async ({ request }) => {
    const res = await call<PageData<PostView>>(request, 'GET', '/posts');
    expect(res.status).toBe(200);
    expectEnvelope(res.body);
    expectPageData(res.body.data);
  });

  test('ADMIN GET /admin/users 返回分页结构与 code=0', async ({ request }) => {
    const admin = await adminSession(request);
    const res = await call<PageData<AuthData['user']>>(request, 'GET', '/admin/users', { token: admin.accessToken });
    expect(res.status).toBe(200);
    expectEnvelope(res.body);
    expectPageData(res.body.data);
    expect(res.body.data.items.length).toBeGreaterThan(0);
  });

  test('错误响应仍保持 {code,message,data:null} 形状', async ({ request }) => {
    const res = await call(request, 'GET', '/does-not-exist');
    expectEnvelope(res.body);
    expect(res.body.data).toBeNull();
    expect(typeof res.body.code).toBe('number');
  });
});

// ---------------------------------------------------------------------------
// 4. 后台 CRUD：用户启停 / 活动·资讯 新建·编辑·删除
// ---------------------------------------------------------------------------

test.describe('真实后台 CRUD（仅 ADMIN）', () => {
  test('PATCH /admin/users/:id 启停用户，返回统一响应体', async ({ request }) => {
    const admin = await adminSession(request);
    const target = await newUser(request, 'toggle');

    const disabled = await call<{ user: AuthData['user'] }>(
      request, 'PATCH', `/admin/users/${target.user.id}`,
      { token: admin.accessToken, data: { status: 'DISABLED' } },
    );
    expect(disabled.status).toBe(200);
    expectEnvelope(disabled.body);
    expect(disabled.body.code).toBe(ErrorCode.OK);
    expect((disabled.body.data as { user: AuthData['user'] }).user.status).toBe('DISABLED');

    // 恢复，避免影响后续用例与数据库状态
    const enabled = await call<{ user: AuthData['user'] }>(
      request, 'PATCH', `/admin/users/${target.user.id}`,
      { token: admin.accessToken, data: { status: 'ACTIVE' } },
    );
    expect(enabled.status).toBe(200);
    expect((enabled.body.data as { user: AuthData['user'] }).user.status).toBe('ACTIVE');
  });

  const activityPayload = {
    title: 'E2E 校园迎新跑',
    summary: '环校 5km 晨跑',
    content: '自动化测试创建的活动。',
    location: '操场',
    startAt: '2026-11-20T07:00:00.000Z',
    endAt: '2026-11-20T09:00:00.000Z',
    capacity: 100,
    status: 'PUBLISHED',
  };

  test('活动新建 / 编辑 / 删除全流程（POST → PATCH → DELETE）', async ({ request }) => {
    const admin = await adminSession(request);

    const created = await call<{ activity: ActivityView }>(
      request, 'POST', '/admin/activities',
      { token: admin.accessToken, data: activityPayload },
    );
    expect([200, 201]).toContain(created.status);
    expectEnvelope(created.body);
    expect(created.body.code).toBe(ErrorCode.OK);
    const id = (created.body.data as { activity: ActivityView }).activity.id;
    expect(id).toEqual(expect.any(String));

    const updated = await call<{ activity: ActivityView }>(
      request, 'PATCH', `/admin/activities/${id}`,
      { token: admin.accessToken, data: { title: 'E2E 校园迎新跑 · 编辑后' } },
    );
    expect(updated.status).toBe(200);
    expectEnvelope(updated.body);
    expect((updated.body.data as { activity: ActivityView }).activity.title).toContain('编辑后');

    const listed = await call<PageData<ActivityView>>(
      request, 'GET', '/admin/activities', { token: admin.accessToken },
    );
    expect(listed.status).toBe(200);
    expectPageData(listed.body.data);
    expect(listed.body.data.items.some((a) => a.id === id)).toBe(true);

    const removed = await call(request, 'DELETE', `/admin/activities/${id}`, { token: admin.accessToken });
    expect(removed.status).toBe(200);
    expectEnvelope(removed.body);
    expect(removed.body.data).toBeNull();
  });

  const postPayload = {
    title: 'E2E 内测公告',
    summary: '自动化资讯',
    content: '自动化测试创建的资讯。',
    status: 'PUBLISHED',
  };

  test('资讯新建 / 编辑 / 删除全流程（POST → PATCH → DELETE）', async ({ request }) => {
    const admin = await adminSession(request);

    const created = await call<{ post: PostView }>(
      request, 'POST', '/admin/posts',
      { token: admin.accessToken, data: postPayload },
    );
    expect([200, 201]).toContain(created.status);
    expectEnvelope(created.body);
    const id = (created.body.data as { post: PostView }).post.id;

    const updated = await call<{ post: PostView }>(
      request, 'PATCH', `/admin/posts/${id}`,
      { token: admin.accessToken, data: { title: 'E2E 内测公告 · 编辑后' } },
    );
    expect(updated.status).toBe(200);
    expect((updated.body.data as { post: PostView }).post.title).toContain('编辑后');

    const removed = await call(request, 'DELETE', `/admin/posts/${id}`, { token: admin.accessToken });
    expect(removed.status).toBe(200);
    expectEnvelope(removed.body);
    expect(removed.body.data).toBeNull();
  });

  test('USER 无法新建活动（接口级 403，非仅前端守卫）', async ({ request }) => {
    const u = await newUser(request, 'nocreate');
    const res = await call(request, 'POST', '/admin/activities', {
      token: u.accessToken,
      data: activityPayload,
    });
    expect(res.status).toBe(403);
    expectEnvelope(res.body);
    expect(res.body.code).toBe(ErrorCode.FORBIDDEN);
  });
});

// ---------------------------------------------------------------------------
// 5. 前端页面可达 + 角色分流（体验层；安全边界已在上面接口级验证）
// ---------------------------------------------------------------------------

test.describe('真实前端页面（Vite 5173）', () => {
  test('首页可达并展示产品名与导航', async ({ page }) => {
    const res = await page.goto(ENTRY_URL, { waitUntil: 'domcontentloaded' });
    expect(res?.status()).toBe(200);
    await expect(page.locator('body')).toContainText('校园行');
  });

  test('未登录访问 /admin 被前端守卫导向登录页（体验层）', async ({ page }) => {
    await page.goto(`${ENTRY_URL}/admin`, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/login$/);
  });

  test('登录页可达，注册页可达', async ({ page }) => {
    await page.goto(`${ENTRY_URL}/login`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText('登录');
    await page.goto(`${ENTRY_URL}/register`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText('注册');
  });
});
