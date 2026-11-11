import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AppModule } from '../app.module';
import { ResponseInterceptor } from '../common/response';
import { ApiExceptionFilter } from '../common/exception.filter';
import { MockPrisma, createMockPrisma } from './prisma.mock';
import { AppConfigService } from '../config/config.service';
import { PrismaService } from '../prisma/prisma.service';

export interface TestApp {
  app: INestApplication;
  prisma: MockPrisma;
  config: AppConfigService;
}

/**
 * 构造挂载真实 controller/service 的 Nest 应用，但把 PrismaService 与
 * AppConfigService 替换为测试替身（不连数据库 / 用测试密钥）。
 * 全局拦截器 / 异常过滤器 / ValidationPipe 与 main.ts 一致，保证契约响应体形态。
 */
export async function createTestApp(): Promise<TestApp> {
  // 提高登录限流阈值，避免功能测试在单进程内累计命中上限（限流本身由独立用例验证）。
  process.env.LOGIN_THROTTLE_LIMIT = process.env.LOGIN_THROTTLE_LIMIT ?? '100000';
  process.env.LOGIN_THROTTLE_TTL = process.env.LOGIN_THROTTLE_TTL ?? '60';

  const prisma = createMockPrisma();
  const config = new AppConfigService(
    new ConfigService({
      NODE_ENV: 'test',
      JWT_ACCESS_SECRET: '{{SECRET_d56ny4ls}}',
      JWT_REFRESH_SECRET: '{{SECRET_4xqs2bw3}}',
      JWT_ACCESS_TTL: '15m',
      JWT_REFRESH_TTL: '7d',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      BCRYPT_ROUNDS: '4',
    }),
  );

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(PrismaService)
    .useValue(prisma)
    .overrideProvider(AppConfigService)
    .useValue(config)
    .compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new ApiExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.setGlobalPrefix('api', { exclude: ['health', 'docs', 'docs-json'] });
  await app.init();

  return { app, prisma, config };
}
