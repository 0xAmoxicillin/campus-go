import {
  ActivityStatus,
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  ErrorCode,
  MAX_PAGE_SIZE,
  PostStatus,
  Role,
  type ActivityView,
  type ApiResponse,
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
  type UpdateMeRequest,
  type UserView,
  UserStatus,
  type AdminUpdateUserRequest,
} from '@/contracts/api-contract';
import { ApiError } from './errors';
import type { AdapterMethod, AdapterRequestInit, ApiAdapter } from './adapter';
import { getAccessToken } from './tokenStore';
import {
  mockCuid,
  seedActivities,
  seedPosts,
  seedUsers,
  type MockUserRecord,
} from './mock/mockData';

// ---------------------------------------------------------------------------
// M1 mock 实现：完全按 docs/api-contract-v0.1.md 构造响应形状。
// 全部走 mock，不真实调用 /api；M2 由真实 HttpAdapter 替换（见 apiClient.ts）。
// ---------------------------------------------------------------------------

const delay = (ms = 200) => new Promise<void>((r) => setTimeout(r, ms));

// 可变内存状态（仅 M1 mock 使用）。
const users: MockUserRecord[] = seedUsers.map((u) => ({ ...u }));
const activities: ActivityView[] = seedActivities.map((a) => ({ ...a }));
const posts: PostView[] = seedPosts.map((p) => ({ ...p }));
const enrollments: EnrollmentView[] = [];

// token -> userId（mock 仅用于角色判定与越权模拟）。
const accessToUser = new Map<string, string>();
const refreshToUser = new Map<string, string>();

function publicUser(u: MockUserRecord): UserView {
  // 绝不返回 passwordHash（契约 §3.1 红线）。
  const { passwordHash: _omit, ...rest } = u;
  return { ...rest };
}

function paginate<T>(items: T[], page = DEFAULT_PAGE, pageSize = DEFAULT_PAGE_SIZE): Paginated<T> {
  const size = Math.min(Math.max(pageSize, 1), MAX_PAGE_SIZE);
  const total = items.length;
  const start = (page - 1) * size;
  return {
    items: items.slice(start, start + size),
    total,
    page,
    pageSize: size,
  };
}

function parseQuery(path: string): ListQuery {
  const qs = path.includes('?') ? path.split('?')[1] : '';
  const sp = new URLSearchParams(qs);
  const num = (k: string, fallback?: number) => {
    const v = sp.get(k);
    if (v == null) return fallback;
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };
  return {
    page: num('page', DEFAULT_PAGE) ?? DEFAULT_PAGE,
    pageSize: num('pageSize', DEFAULT_PAGE_SIZE) ?? DEFAULT_PAGE_SIZE,
    q: sp.get('q') ?? undefined,
    role: (sp.get('role') as Role | null) ?? undefined,
    status: (sp.get('status') as UserStatus | null) ?? undefined,
  };
}

function currentUserId(): string | null {
  // mock 同样走「真实客户端」那份内存 token（setTokens 写入 tokenStore），
  // 以与真实 HttpAdapter 的 Authorization 判定口径一致：演示登录后，受保护请求可鉴权。
  const token = getAccessToken();
  if (!token) return null;
  return accessToUser.get(token) ?? null;
}

function requireUser(): MockUserRecord {
  const uid = currentUserId();
  if (!uid) throw new ApiError(ErrorCode.UNAUTHORIZED, '未登录或 token 缺失/无效');
  const u = users.find((x) => x.id === uid);
  if (!u) throw new ApiError(ErrorCode.UNAUTHORIZED, '未登录或 token 缺失/无效');
  return u;
}

function requireAdmin(): MockUserRecord {
  const u = requireUser();
  if (u.role !== Role.ADMIN) throw new ApiError(ErrorCode.FORBIDDEN, '越权：角色不足（RBAC 红线）');
  return u;
}

// 密码规则（与契约 §3.1、前端 zod 校验一致；mock 再次兜底返回 40001）。
const PW_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function issueTokens(user: MockUserRecord): AuthResult {
  const accessToken = `mock.access.${user.id}.${mockCuid()}`;
  const refreshToken = `mock.refresh.${user.id}.${mockCuid()}`;
  accessToUser.set(accessToken, user.id);
  refreshToUser.set(refreshToken, user.id);
  return { user: publicUser(user), accessToken, refreshToken };
}

function ok(data: unknown): ApiResponse<unknown> {
  return { code: ErrorCode.SUCCESS, message: 'ok', data };
}

// 内部 handler 返回 ApiResponse<unknown>，泛型 T 在 ApiAdapter.request<T> 边界处转回具体类型。
async function handle(path: string, init: AdapterRequestInit = {}): Promise<ApiResponse<unknown>> {
  await delay();
  const method: AdapterMethod = init.method ?? 'GET';
  const body = (init.body ?? {}) as Record<string, unknown>;
  // 路由用去参路径（查询串仅用于解析分页/过滤，不参与路径匹配）。
  const routePath = path.split('?')[0];

  // ---- Auth ----
  if (routePath === '/auth/register' && method === 'POST') {
    const { email, password, name } = body as unknown as RegisterRequest;
    if (!EMAIL_RE.test(email ?? '') || !PW_RE.test(password ?? '') || !name) {
      throw new ApiError(ErrorCode.VALIDATION_FAILED, '参数校验失败（邮箱格式 / 密码≥8位含大小写与数字 / 姓名必填）');
    }
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      throw new ApiError(ErrorCode.CONFLICT, '邮箱已注册');
    }
    // 安全红线：注册接口一律忽略请求体中的 role，硬编码 USER。
    const user: MockUserRecord = {
      id: mockCuid('ck_user_'),
      email,
      name,
      role: Role.USER,
      status: UserStatus.ACTIVE,
      createdAt: new Date().toISOString(),
      passwordHash: `mock$${password}`,
    };
    users.push(user);
    return ok(issueTokens(user));
  }

  if (routePath === '/auth/login' && method === 'POST') {
    const { email, password } = body as unknown as LoginRequest;
    const user = users.find((u) => u.email.toLowerCase() === (email ?? '').toLowerCase());
    if (!user || user.passwordHash !== `mock$${password}`) {
      throw new ApiError(ErrorCode.CREDENTIAL_ERROR, '账号或密码错误');
    }
    return ok(issueTokens(user));
  }

  if (routePath === '/auth/refresh' && method === 'POST') {
    const { refreshToken } = body as unknown as RefreshRequest;
    const uid = refreshToken ? refreshToUser.get(refreshToken) : undefined;
    if (!uid) throw new ApiError(ErrorCode.TOKEN_EXPIRED, 'token 过期或无效');
    const user = users.find((u) => u.id === uid);
    if (!user) throw new ApiError(ErrorCode.UNAUTHORIZED, '未登录或 token 缺失/无效');
    refreshToUser.delete(refreshToken);
    const next = issueTokens(user); // 刷新轮换：返回新的 access/refresh
    return ok(next);
  }

  if (routePath === '/auth/logout' && method === 'POST') {
    const { refreshToken } = body as unknown as { refreshToken: string };
    if (refreshToken) {
      // 吊销 refresh 及其派发的 access（刷新轮换：旧 refresh 失效）。
      const uid = refreshToUser.get(refreshToken);
      refreshToUser.delete(refreshToken);
      if (uid) {
        for (const [k, v] of accessToUser) if (v === uid) accessToUser.delete(k);
      }
    }
    return ok(null);
  }

  // ---- 用户自助（需登录）----
  if (routePath === '/users/me' && method === 'GET') {
    return ok(publicUser(requireUser()));
  }
  if (routePath === '/users/me' && method === 'PATCH') {
    const u = requireUser();
    const { name } = body as unknown as UpdateMeRequest;
    if (name) u.name = name; // email/role/status 不可在此修改
    return ok(publicUser(u));
  }

  // ---- 官网公开内容 ----
  if (routePath.startsWith('/activities') && method === 'GET') {
    const idMatch = routePath.match(/^\/activities\/([^/]+)$/);
    if (idMatch) {
      const act = activities.find((a) => a.id === idMatch[1] && a.status === ActivityStatus.PUBLISHED);
      if (!act) throw new ApiError(ErrorCode.NOT_FOUND, '活动不存在');
      return ok(act);
    }
    const q = parseQuery(path);
    const filtered = activities.filter(
      (a) => a.status === ActivityStatus.PUBLISHED && (!q.q || a.title.includes(q.q) || a.summary.includes(q.q)),
    );
    return ok(paginate(filtered, q.page, q.pageSize));
  }

  if (routePath.startsWith('/activities/') && routePath.endsWith('/join') && method === 'POST') {
    const id = routePath.split('/')[2];
    const u = requireUser();
    const act = activities.find((a) => a.id === id);
    if (!act || act.status !== ActivityStatus.PUBLISHED) throw new ApiError(ErrorCode.NOT_FOUND, '活动不存在');
    if (enrollments.some((e) => e.userId === u.id && e.activityId === id)) {
      throw new ApiError(ErrorCode.CONFLICT, '重复报名');
    }
    const enrolled = enrollments.filter((e) => e.activityId === id).length;
    if (enrolled >= act.capacity) throw new ApiError(ErrorCode.CONFLICT, '活动名额已满');
    const e: EnrollmentView = { id: mockCuid('ck_enr_'), userId: u.id, activityId: id, createdAt: new Date().toISOString() };
    enrollments.push(e);
    return ok(e);
  }

  if (routePath.startsWith('/posts') && method === 'GET') {
    const idMatch = routePath.match(/^\/posts\/([^/]+)$/);
    if (idMatch) {
      const p = posts.find((x) => x.id === idMatch[1] && x.status === PostStatus.PUBLISHED);
      if (!p) throw new ApiError(ErrorCode.NOT_FOUND, '资讯不存在');
      return ok(p);
    }
    const q = parseQuery(path);
    const filtered = posts.filter(
      (x) => x.status === PostStatus.PUBLISHED && (!q.q || x.title.includes(q.q) || x.summary.includes(q.q)),
    );
    return ok(paginate(filtered, q.page, q.pageSize));
  }

  // ---- 管理员后台（仅 ADMIN）----
  if (routePath.startsWith('/admin/')) {
    requireAdmin(); // 未登录 40100 / 非 ADMIN 40300
    if (routePath === '/admin/users' && method === 'GET') {
      const q = parseQuery(path);
      let list = users.slice();
      if (q.role) list = list.filter((u) => u.role === q.role);
      if (q.status) list = list.filter((u) => u.status === q.status);
      const kw = q.q;
      if (kw) list = list.filter((u) => u.name.includes(kw) || u.email.includes(kw));
      return ok(paginate(list.map(publicUser), q.page, q.pageSize));
    }
    if (routePath.startsWith('/admin/users/') && method === 'PATCH') {
      const id = routePath.split('/')[3];
      const u = users.find((x) => x.id === id);
      if (!u) throw new ApiError(ErrorCode.NOT_FOUND, '用户不存在');
      const { status, role } = body as unknown as AdminUpdateUserRequest;
      if (status) u.status = status;
      if (role) u.role = role;
      return ok(publicUser(u));
    }
    if (routePath === '/admin/activities' && method === 'GET') {
      const q = parseQuery(path);
      return ok(paginate(activities, q.page, q.pageSize));
    }
    if (routePath === '/admin/activities' && method === 'POST') {
      const b = body as unknown as CreateActivityRequest;
      const admin = requireUser();
      const act: ActivityView = {
        id: mockCuid('ck_act_'),
        title: b.title, summary: b.summary, content: b.content, coverUrl: b.coverUrl,
        location: b.location, startAt: b.startAt, endAt: b.endAt, capacity: b.capacity,
        status: ActivityStatus.DRAFT, createdById: admin.id,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      };
      activities.push(act);
      return ok(act);
    }
    if (routePath.startsWith('/admin/activities/') && method === 'PATCH') {
      const id = routePath.split('/')[3];
      const act = activities.find((a) => a.id === id);
      if (!act) throw new ApiError(ErrorCode.NOT_FOUND, '活动不存在');
      return ok(act);
    }
    if (routePath.startsWith('/admin/activities/') && method === 'DELETE') {
      const id = routePath.split('/')[3];
      const idx = activities.findIndex((a) => a.id === id);
      if (idx < 0) throw new ApiError(ErrorCode.NOT_FOUND, '活动不存在');
      activities.splice(idx, 1);
      return ok(null);
    }
    if (routePath === '/admin/posts' && method === 'GET') {
      const q = parseQuery(path);
      return ok(paginate(posts, q.page, q.pageSize));
    }
    if (routePath === '/admin/posts' && method === 'POST') {
      const b = body as unknown as CreatePostRequest;
      const admin = requireUser();
      const p: PostView = {
        id: mockCuid('ck_post_'),
        title: b.title, summary: b.summary, content: b.content, coverUrl: b.coverUrl,
        status: PostStatus.DRAFT, createdById: admin.id,
        createdAt: new Date().toISOString(), publishedAt: '',
      };
      posts.push(p);
      return ok(p);
    }
    if (routePath.startsWith('/admin/posts/') && method === 'PATCH') {
      const id = routePath.split('/')[3];
      const p = posts.find((x) => x.id === id);
      if (!p) throw new ApiError(ErrorCode.NOT_FOUND, '资讯不存在');
      return ok(p);
    }
    if (path.startsWith('/admin/posts/') && method === 'DELETE') {
      const id = routePath.split('/')[3];
      const idx = posts.findIndex((x) => x.id === id);
      if (idx < 0) throw new ApiError(ErrorCode.NOT_FOUND, '资讯不存在');
      posts.splice(idx, 1);
      return ok(null);
    }
    throw new ApiError(ErrorCode.NOT_FOUND, '未匹配的管理端路径');
  }

  throw new ApiError(ErrorCode.NOT_FOUND, '未匹配的路径');
}

export function createMockAdapter(): ApiAdapter {
  return {
    async request<T>(path: string, init?: AdapterRequestInit): Promise<ApiResponse<T>> {
      const res = await handle(path, init);
      return res as ApiResponse<T>;
    },
  };
}
