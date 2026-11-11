import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { TestApp, createTestApp } from './test-app';

/**
 * 应用基础设施验收测试（M2 更新）：
 * - Swagger 文档可生成且包含 21 个契约端点（4 auth + 2 users + 5 content + 10 admin）；
 * - /api/admin/** 与 /api/users/me 在接口级 Guards 下，未登录访问返回 401（安全边界）；
 * - 公开活动列表返回统一分页响应体形态；
 * - login 缺参被 zod 校验拦截为 400 / code=40001（而非崩溃）。
 * 使用 createTestApp（mock Prisma），不连接真实数据库。
 */
describe('App infrastructure (M2)', () => {
  let ctx: TestApp;
  let app: INestApplication;

  beforeAll(async () => {
    ctx = await createTestApp();
    app = ctx.app;
  });

  afterAll(async () => {
    await app?.close();
  });

  it('Swagger 文档生成且包含全部 21 个契约端点', () => {
    const builder = new DocumentBuilder().setTitle('t').setDescription('t').setVersion('0.1').build();
    const doc = SwaggerModule.createDocument(app, builder);
    const paths = Object.keys(doc.paths);
    expect(paths).toContain('/api/auth/register');
    expect(paths).toContain('/api/auth/login');
    expect(paths).toContain('/api/auth/refresh');
    expect(paths).toContain('/api/auth/logout');
    expect(paths).toContain('/api/users/me');
    expect(paths).toContain('/api/activities');
    expect(paths).toContain('/api/activities/{id}');
    expect(paths).toContain('/api/activities/{id}/join');
    expect(paths).toContain('/api/posts');
    expect(paths).toContain('/api/posts/{id}');
    expect(paths).toContain('/api/admin/users');
    expect(paths).toContain('/api/admin/users/{id}');
    expect(paths).toContain('/api/admin/activities');
    expect(paths).toContain('/api/admin/activities/{id}');
    expect(paths).toContain('/api/admin/posts');
    expect(paths).toContain('/api/admin/posts/{id}');
    // 4 auth + 2 users + 5 content + 10 admin = 21
    const methodCount = Object.values(doc.paths).reduce(
      (sum, p: any) => sum + Object.keys(p).length,
      0,
    );
    expect(methodCount).toBe(21);
  });

  it('未登录访问 /api/admin/users 返回 401（接口级鉴权边界）', async () => {
    const res = await request(app.getHttpServer()).get('/api/admin/users');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe(40100);
    expect(res.body).toHaveProperty('message');
    expect(res.body.data).toBeNull();
  });

  it('未登录访问 /api/users/me 返回 401', async () => {
    const res = await request(app.getHttpServer()).get('/api/users/me');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe(40100);
  });

  it('公开活动列表返回统一响应体形态（M2：分页结构）', async () => {
    ctx.prisma.activity.findMany.mockResolvedValue([]);
    ctx.prisma.activity.count.mockResolvedValue(0);
    const res = await request(app.getHttpServer()).get('/api/activities');
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(0);
    expect(res.body).toHaveProperty('message', 'ok');
    expect(res.body.data).toHaveProperty('items');
    expect(res.body.data).toHaveProperty('total');
    expect(res.body.data).toHaveProperty('page');
    expect(res.body.data).toHaveProperty('pageSize');
  });

  it('login 缺参被 zod 校验拦截为 400/code=40001（而非崩溃）', async () => {
    const res = await request(app.getHttpServer()).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
    expect(res.body.code).toBe(40001);
    expect(res.body.data).toBeNull();
  });
});
