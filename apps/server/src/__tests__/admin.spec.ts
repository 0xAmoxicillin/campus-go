import request from 'supertest';
import { TestApp, createTestApp } from './test-app';
import { issueAccessToken } from './auth-helper';
import { User, Role, UserStatus, ActivityStatus, PostStatus } from '@prisma/client';

describe('AdminController RBAC + CRUD (M2)', () => {
  let ctx: TestApp;

  const makeUser = (over: Partial<User> = {}): User =>
    ({
      id: over.id ?? 'usr_1',
      email: over.email ?? 'u@campus.edu',
      passwordHash: 'h',
      name: over.name ?? '用户',
      role: over.role ?? Role.USER,
      status: over.status ?? UserStatus.ACTIVE,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
    }) as User;

  const activity = (over: any = {}) => ({
    id: 'act_1',
    title: 'A',
    summary: 's',
    content: 'c',
    coverUrl: null,
    location: null,
    startAt: new Date('2026-09-01T00:00:00Z'),
    endAt: new Date('2026-09-02T00:00:00Z'),
    capacity: null,
    status: ActivityStatus.DRAFT,
    createdById: null,
    createdAt: new Date('2026-08-01T00:00:00Z'),
    updatedAt: new Date('2026-08-01T00:00:00Z'),
    ...over,
  });

  const post = (over: any = {}) => ({
    id: 'pst_1',
    title: 'P',
    summary: 's',
    content: 'c',
    coverUrl: null,
    status: PostStatus.DRAFT,
    createdById: null,
    createdAt: new Date('2026-08-01T00:00:00Z'),
    publishedAt: null,
    ...over,
  });

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  describe('RBAC 红线', () => {
    it('未登录访问 /api/admin/users → 401 / 40100', async () => {
      const res = await request(ctx.app.getHttpServer()).get('/api/admin/users');
      expect(res.status).toBe(401);
      expect(res.body.code).toBe(40100);
    });

    it('USER 访问 /api/admin/users → 403 / 40300', async () => {
      const access = await issueAccessToken(ctx, makeUser({ role: Role.USER }));
      const res = await request(ctx.app.getHttpServer())
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${access}`);
      expect(res.status).toBe(403);
      expect(res.body.code).toBe(40300);
    });

    it('USER 访问 /api/admin/activities POST → 403 / 40300', async () => {
      const access = await issueAccessToken(ctx, makeUser({ role: Role.USER }));
      const res = await request(ctx.app.getHttpServer())
        .post('/api/admin/activities')
        .set('Authorization', `Bearer ${access}`)
        .send({ title: 'x', summary: 's', content: 'c', startAt: new Date().toISOString(), endAt: new Date().toISOString(), status: 'DRAFT' });
      expect(res.status).toBe(403);
      expect(res.body.code).toBe(40300);
    });
  });

  describe('ADMIN 操作', () => {
    let adminAccess: string;

    beforeAll(async () => {
      adminAccess = await issueAccessToken(ctx, makeUser({ id: 'admin_1', role: Role.ADMIN, email: 'admin@campus.edu' }));
    });

    it('ADMIN 用户列表：分页 + 过滤', async () => {
      ctx.prisma.user.findMany.mockResolvedValue([makeUser({ role: Role.ADMIN })]);
      ctx.prisma.user.count.mockResolvedValue(1);
      const res = await request(ctx.app.getHttpServer())
        .get('/api/admin/users?role=ADMIN&page=1&pageSize=20')
        .set('Authorization', `Bearer ${adminAccess}`);
      expect(res.status).toBe(200);
      expect(res.body.data.items[0].role).toBe('ADMIN');
      expect(res.body.data).toEqual({ items: expect.any(Array), total: 1, page: 1, pageSize: 20 });
    });

    it('ADMIN 改用户 status（启停）→ {user}', async () => {
      ctx.prisma.user.findUnique.mockResolvedValue(makeUser({ id: 'usr_x' }));
      ctx.prisma.user.update.mockImplementation(async ({ data }: any) => makeUser({ id: 'usr_x', status: data.status }));
      const res = await request(ctx.app.getHttpServer())
        .patch('/api/admin/users/usr_x')
        .set('Authorization', `Bearer ${adminAccess}`)
        .send({ status: 'DISABLED' });
      expect(res.status).toBe(200);
      expect(res.body.data.user.status).toBe('DISABLED');
      expect(res.body.data).toHaveProperty('user');
    });

    it('ADMIN 活动列表含 DRAFT/ARCHIVED（非公开过滤）', async () => {
      ctx.prisma.activity.findMany.mockResolvedValue([activity({ status: ActivityStatus.DRAFT }), activity({ id: 'act_2', status: ActivityStatus.ARCHIVED })]);
      ctx.prisma.activity.count.mockResolvedValue(2);
      const res = await request(ctx.app.getHttpServer())
        .get('/api/admin/activities')
        .set('Authorization', `Bearer ${adminAccess}`);
      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(2);
      expect(res.body.data.items.map((a: any) => a.status)).toContain('DRAFT');
    });

    it('ADMIN 新建活动 → 201 {activity}', async () => {
      ctx.prisma.activity.create.mockImplementation(async ({ data }: any) => activity({ title: data.title, status: data.status }));
      const res = await request(ctx.app.getHttpServer())
        .post('/api/admin/activities')
        .set('Authorization', `Bearer ${adminAccess}`)
        .send({ title: '新活动', summary: 's', content: 'c', startAt: new Date().toISOString(), endAt: new Date(Date.now() + 86400000).toISOString(), status: 'DRAFT' });
      expect(res.status).toBe(201);
      expect(res.body.data.activity.title).toBe('新活动');
      expect(res.body.data).toHaveProperty('activity');
    });

    it('ADMIN 新建资讯 → 201 {post}', async () => {
      ctx.prisma.post.create.mockImplementation(async ({ data }: any) => post({ title: data.title, status: data.status }));
      const res = await request(ctx.app.getHttpServer())
        .post('/api/admin/posts')
        .set('Authorization', `Bearer ${adminAccess}`)
        .send({ title: '新资讯', summary: 's', content: 'c', status: 'DRAFT' });
      expect(res.status).toBe(201);
      expect(res.body.data.post.title).toBe('新资讯');
      expect(res.body.data).toHaveProperty('post');
    });

    it('ADMIN 列表 pageSize=101 → 400 / 40001', async () => {
      const res = await request(ctx.app.getHttpServer())
        .get('/api/admin/activities?pageSize=101')
        .set('Authorization', `Bearer ${adminAccess}`);
      expect(res.status).toBe(400);
      expect(res.body.code).toBe(40001);
    });

    it('ADMIN 删除活动 → 200 data=null', async () => {
      ctx.prisma.activity.findUnique.mockResolvedValue(activity({ id: 'act_del' }));
      ctx.prisma.activity.delete.mockResolvedValue(activity({ id: 'act_del' }));
      const res = await request(ctx.app.getHttpServer())
        .delete('/api/admin/activities/act_del')
        .set('Authorization', `Bearer ${adminAccess}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toBeNull();
    });
  });
});
