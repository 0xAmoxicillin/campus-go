import request from 'supertest';
import { TestApp, createTestApp } from './test-app';
import { issueAccessToken } from './auth-helper';
import { User, Role, UserStatus, ActivityStatus, PostStatus } from '@prisma/client';

describe('Content / Users (M2)', () => {
  let ctx: TestApp;

  const user = (over: Partial<User> = {}): User =>
    ({
      id: 'usr_1',
      email: 'student@campus.edu',
      passwordHash: 'h',
      name: '小明',
      role: Role.USER,
      status: UserStatus.ACTIVE,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
      ...over,
    }) as User;

  const activity = (over: any = {}) => ({
    id: 'act_1',
    title: '迎新会',
    summary: 's',
    content: 'c',
    coverUrl: null,
    location: null,
    startAt: new Date('2026-09-01T00:00:00Z'),
    endAt: new Date('2026-09-02T00:00:00Z'),
    capacity: null,
    status: ActivityStatus.PUBLISHED,
    createdById: null,
    createdAt: new Date('2026-08-01T00:00:00Z'),
    updatedAt: new Date('2026-08-01T00:00:00Z'),
    ...over,
  });

  const post = (over: any = {}) => ({
    id: 'pst_1',
    title: '公告',
    summary: 's',
    content: 'c',
    coverUrl: null,
    status: PostStatus.PUBLISHED,
    createdById: null,
    createdAt: new Date('2026-08-01T00:00:00Z'),
    publishedAt: new Date('2026-08-02T00:00:00Z'),
    ...over,
  });

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  describe('公开内容列表（仅 PUBLISHED）', () => {
    it('活动列表只返回 PUBLISHED，且结构为分页', async () => {
      ctx.prisma.activity.findMany.mockResolvedValue([activity()]);
      ctx.prisma.activity.count.mockResolvedValue(1);
      const res = await request(ctx.app.getHttpServer()).get('/api/activities?page=1&pageSize=20');
      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].status).toBe('PUBLISHED');
      expect(res.body.data).toEqual({ items: expect.any(Array), total: 1, page: 1, pageSize: 20 });
    });

    it('活动详情非 PUBLISHED → 404', async () => {
      ctx.prisma.activity.findUnique.mockResolvedValue(activity({ status: ActivityStatus.DRAFT }));
      const res = await request(ctx.app.getHttpServer()).get('/api/activities/act_draft');
      expect(res.status).toBe(404);
      expect(res.body.code).toBe(40400);
    });

    it('资讯列表只返回 PUBLISHED', async () => {
      ctx.prisma.post.findMany.mockResolvedValue([post()]);
      ctx.prisma.post.count.mockResolvedValue(1);
      const res = await request(ctx.app.getHttpServer()).get('/api/posts');
      expect(res.status).toBe(200);
      expect(res.body.data.items[0].status).toBe('PUBLISHED');
    });

    it('pageSize 上限 100（zod 约束，超界按 400 拒绝）', async () => {
      const res = await request(ctx.app.getHttpServer()).get('/api/activities?pageSize=200');
      expect(res.status).toBe(400);
      expect(res.body.code).toBe(40001);
    });
  });

  describe('报名 join', () => {
    it('未登录报名 → 401', async () => {
      const res = await request(ctx.app.getHttpServer()).post('/api/activities/act_1/join');
      expect(res.status).toBe(401);
      expect(res.body.code).toBe(40100);
    });

    it('已报名重复报名 → 409', async () => {
      const access = await issueAccessToken(ctx, user());
      ctx.prisma.activity.findUnique.mockResolvedValue(activity());
      ctx.prisma.enrollment.findUnique.mockResolvedValue({ id: 'enr_1', userId: 'usr_1', activityId: 'act_1', createdAt: new Date() });
      const res = await request(ctx.app.getHttpServer())
        .post('/api/activities/act_1/join')
        .set('Authorization', `Bearer ${access}`);
      expect(res.status).toBe(409);
      expect(res.body.code).toBe(40900);
    });

    it('名额已满 → 409', async () => {
      const access = await issueAccessToken(ctx, user());
      ctx.prisma.activity.findUnique.mockResolvedValue(activity({ capacity: 1 }));
      ctx.prisma.enrollment.findUnique.mockResolvedValue(null);
      ctx.prisma.enrollment.count.mockResolvedValue(1);
      const res = await request(ctx.app.getHttpServer())
        .post('/api/activities/act_1/join')
        .set('Authorization', `Bearer ${access}`);
      expect(res.status).toBe(409);
      expect(res.body.code).toBe(40900);
    });

    it('正常报名 → 201，返回 enrollment', async () => {
      const access = await issueAccessToken(ctx, user());
      ctx.prisma.activity.findUnique.mockResolvedValue(activity({ capacity: 10 }));
      ctx.prisma.enrollment.findUnique.mockResolvedValue(null);
      ctx.prisma.enrollment.count.mockResolvedValue(0);
      ctx.prisma.enrollment.create.mockImplementation(async ({ data }: any) => ({
        id: 'enr_2', userId: data.userId, activityId: data.activityId, createdAt: new Date(),
      }));
      const res = await request(ctx.app.getHttpServer())
        .post('/api/activities/act_1/join')
        .set('Authorization', `Bearer ${access}`);
      expect(res.status).toBe(201);
      expect(res.body.data.enrollment.activityId).toBe('act_1');
    });
  });

  describe('用户自助 /users/me', () => {
    it('未登录取资料 → 401', async () => {
      const res = await request(ctx.app.getHttpServer()).get('/api/users/me');
      expect(res.status).toBe(401);
      expect(res.body.code).toBe(40100);
    });

    it('GET /users/me → 200，user 不含 passwordHash', async () => {
      const access = await issueAccessToken(ctx, user());
      ctx.prisma.user.findUnique.mockResolvedValue(user());
      const res = await request(ctx.app.getHttpServer())
        .get('/api/users/me')
        .set('Authorization', `Bearer ${access}`);
      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe('student@campus.edu');
      expect(res.body.data.user).not.toHaveProperty('passwordHash');
    });

    it('PATCH /users/me 仅允许改 name（role 不可改）', async () => {
      const access = await issueAccessToken(ctx, user());
      ctx.prisma.user.update.mockImplementation(async ({ data }: any) => user({ name: data.name }));
      const res = await request(ctx.app.getHttpServer())
        .patch('/api/users/me')
        .set('Authorization', `Bearer ${access}`)
        .send({ name: '新名字', role: 'ADMIN' });
      expect(res.status).toBe(200);
      expect(res.body.data.user.name).toBe('新名字');
      expect(res.body.data.user.role).toBe('USER');
    });
  });
});
