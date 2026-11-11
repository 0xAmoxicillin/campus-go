import request from 'supertest';
import { TestApp, createTestApp } from './test-app';
import { User, Role, UserStatus } from '@prisma/client';

describe('AuthController (M2)', () => {
  let ctx: TestApp;

  const baseUser = (over: Partial<User> = {}): User =>
    ({
      id: 'usr_1',
      email: 'student@campus.edu',
      passwordHash: 'hashed',
      name: '小明',
      role: Role.USER,
      status: UserStatus.ACTIVE,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
      ...over,
    }) as User;

  // refresh token 存储替身：模拟 RefreshToken 表的 tokenHash → record。
  const refreshStore = new Map<string, any>();

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(() => {
    refreshStore.clear();
    ctx.prisma.user.findUnique.mockReset();
    ctx.prisma.user.create.mockReset();
    ctx.prisma.refreshToken.create.mockReset();
    ctx.prisma.refreshToken.findUnique.mockReset();
    ctx.prisma.refreshToken.update.mockReset();
    ctx.prisma.refreshToken.updateMany.mockReset();

    // 默认：user.findUnique 返回 baseUser（refresh 校验用）；register 用例会覆盖为 null。
    ctx.prisma.user.findUnique.mockResolvedValue(baseUser());
    // refresh token 存储：create 落库、findUnique 查库、update 置 revokedAt。
    ctx.prisma.refreshToken.create.mockImplementation(async ({ data }: any) => {
      const rec = { id: `rt_${Math.random()}`, ...data, revokedAt: null };
      refreshStore.set(data.tokenHash, rec);
      return rec;
    });
    ctx.prisma.refreshToken.findUnique.mockImplementation(async ({ where }: any) =>
      refreshStore.get(where.tokenHash) ?? null,
    );
    ctx.prisma.refreshToken.update.mockImplementation(async ({ where, data }: any) => {
      const rec = refreshStore.get(where.tokenHash);
      if (rec) Object.assign(rec, data);
      return rec;
    });
  });

  describe('register', () => {
    it('成功注册（201），user 视图不含 passwordHash', async () => {
      ctx.prisma.user.findUnique.mockResolvedValue(null);
      ctx.prisma.user.create.mockImplementation(async ({ data }: any) =>
        baseUser({ email: data.email, name: data.name, role: data.role }),
      );
      const res = await request(ctx.app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'new@campus.edu', password: 'Passw0rd', name: '新同学' });
      expect(res.status).toBe(201);
      expect(res.body.code).toBe(0);
      expect(res.body.data.user.email).toBe('new@campus.edu');
      expect(res.body.data.user.role).toBe('USER');
      expect(res.body.data.user).not.toHaveProperty('passwordHash');
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
    });

    it('红线：请求体带 role=ADMIN 也被忽略，结果仍是 USER', async () => {
      ctx.prisma.user.findUnique.mockResolvedValue(null);
      let capturedRole: string | undefined;
      ctx.prisma.user.create.mockImplementation(async ({ data }: any) => {
        capturedRole = data.role;
        return baseUser({ email: data.email, role: data.role });
      });
      const res = await request(ctx.app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'evil@campus.edu', password: 'Passw0rd', name: '黑客', role: 'ADMIN' });
      expect(res.status).toBe(201);
      expect(capturedRole).toBe('USER');
      expect(res.body.data.user.role).toBe('USER');
    });

    it('密码强度不足（<8 / 缺大小写数字）→ 40001', async () => {
      const res = await request(ctx.app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'a@campus.edu', password: 'weak', name: 'x' });
      expect(res.status).toBe(400);
      expect(res.body.code).toBe(40001);
    });

    it('邮箱格式非法 → 40001', async () => {
      const res = await request(ctx.app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'not-an-email', password: 'Passw0rd', name: 'x' });
      expect(res.status).toBe(400);
      expect(res.body.code).toBe(40001);
    });

    it('邮箱重复 → 409 / 40900', async () => {
      ctx.prisma.user.findUnique.mockResolvedValue(baseUser());
      const res = await request(ctx.app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'student@campus.edu', password: 'Passw0rd', name: '小明' });
      expect(res.status).toBe(409);
      expect(res.body.code).toBe(40900);
    });
  });

  describe('login', () => {
    it('密码错误 → 401 / 40102（不区分用户是否存在，避免枚举）', async () => {
      ctx.prisma.user.findUnique.mockResolvedValue(null);
      const res = await request(ctx.app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'student@campus.edu', password: 'WrongPass1' });
      expect(res.status).toBe(401);
      expect(res.body.code).toBe(40102);
    });

    it('账号被停用（DISABLED）登录被拒 → 401 / 40102', async () => {
      ctx.prisma.user.findUnique.mockResolvedValue(baseUser({ status: UserStatus.DISABLED }));
      const res = await request(ctx.app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'student@campus.edu', password: 'Passw0rd' });
      expect(res.status).toBe(401);
      expect(res.body.code).toBe(40102);
    });
  });

  describe('refresh（轮换）', () => {
    it('使用已吊销的旧 refresh token → 401', async () => {
      const oldRefresh = await issueRefresh(ctx);
      const first = await request(ctx.app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken: oldRefresh });
      expect(first.status).toBe(200);
      const reuse = await request(ctx.app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken: oldRefresh });
      expect(reuse.status).toBe(401);
    });

    it('refresh 返回的响应只含 access/refresh 令牌对（不含 user）', async () => {
      const oldRefresh = await issueRefresh(ctx);
      const first = await request(ctx.app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken: oldRefresh });
      expect(first.body.data).toHaveProperty('accessToken');
      expect(first.body.data).toHaveProperty('refreshToken');
      expect(first.body.data).not.toHaveProperty('user');
    });
  });

  describe('logout', () => {
    it('未携带 Bearer → 401', async () => {
      const res = await request(ctx.app.getHttpServer())
        .post('/api/auth/logout')
        .send({ refreshToken: 'whatever' });
      expect(res.status).toBe(401);
      expect(res.body.code).toBe(40100);
    });

    it('携带 Bearer 调用登出 → 200，吊销 refresh', async () => {
      const access = await issueAccess(ctx);
      ctx.prisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });
      const res = await request(ctx.app.getHttpServer())
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${access}`)
        .send({ refreshToken: 'some-token' });
      expect(res.status).toBe(200);
      expect(ctx.prisma.refreshToken.updateMany).toHaveBeenCalled();
    });
  });
});

// 辅助：通过 register 拿到一个「未轮换」的真实 refreshToken（直接取注册返回的，不再 refresh，
// 否则内部 refresh 会立即吊销该 token，导致后续复用测试失效）。
async function issueRefresh(ctx: TestApp): Promise<string> {
  const u = {
    id: 'usr_1',
    email: 'student@campus.edu',
    passwordHash: 'h',
    name: '小明',
    role: 'USER',
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any;
  ctx.prisma.user.create.mockImplementation(async ({ data }: any) =>
    ({ ...u, email: data.email, name: data.name, role: data.role }) as any,
  );
  ctx.prisma.user.findUnique.mockImplementation(async ({ where }: any) =>
    where.email !== undefined ? null : where.id === u.id ? u : null,
  );
  const res = await request(ctx.app.getHttpServer())
    .post('/api/auth/register')
    .send({ email: `u_${Date.now()}_${Math.random()}@campus.edu`, password: 'Passw0rd', name: 't' });
  return res.body.data.refreshToken as string;
}

async function issueAccess(ctx: TestApp): Promise<string> {
  const refresh = await issueRefresh(ctx);
  const res = await request(ctx.app.getHttpServer())
    .post('/api/auth/refresh')
    .send({ refreshToken: refresh });
  return res.body.data.accessToken as string;
}
