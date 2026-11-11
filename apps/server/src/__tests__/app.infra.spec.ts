import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../app.module';
import { ResponseInterceptor } from '../common/response';
import { ApiExceptionFilter } from '../common/exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * M1 基础设施验收测试：
 * - 统一响应体 { code, message, data } 形态；
 * - 异常过滤器把未实现端点收敛为 500 / code=50000（而非崩溃）；
 * - Swagger 文档可生成且包含 21 个契约端点（4 auth + 2 users + 5 content + 10 admin）；
 * - /api/admin/** 在 JwtAuthGuard+RolesGuard 下，未登录访问返回 401（安全边界）。
 * 注意：本测试不连接数据库（NODE_ENV=test 下 PrismaService 不自动连接）。
 */
describe('App infrastructure (M1)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_ACCESS_SECRET = 'test-access-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalInterceptors(new ResponseInterceptor());
    app.useGlobalFilters(new ApiExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true, transformOptions: { enableImplicitConversion: true } }),
    );
    app.setGlobalPrefix('api', { exclude: ['health', 'docs', 'docs-json'] });
    await app.init();
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
    // 4 auth + 2 users + 5 content + 10 admin = 21（按契约 §3.4 表格实列 10 个 admin 端点）
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

  it('公开活动列表返回统一响应体形态（M1 骨架 data=null，但结构合规）', async () => {
    const res = await request(app.getHttpServer()).get('/api/activities');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ code: 0, message: 'ok', data: null });
  });

  it('未实现的 auth 端点被异常过滤器收敛为 500/code=50000', async () => {
    const res = await request(app.getHttpServer()).post('/api/auth/login').send({});
    expect(res.status).toBe(500);
    expect(res.body.code).toBe(50000);
    expect(res.body.data).toBeNull();
  });
});
