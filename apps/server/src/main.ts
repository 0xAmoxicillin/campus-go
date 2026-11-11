import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AppConfigService } from './config/config.service';
import { ResponseInterceptor } from './common/response';
import { ApiExceptionFilter } from './common/exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: false });

  const config = app.get(AppConfigService);
  const logger = new Logger('Bootstrap');

  // 统一响应包装 + 异常过滤器（契约 §0）。
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new ApiExceptionFilter());

  // class-validator 校验（失败 → 40001）。
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // CORS 白名单：仅允许 .env 中 CORS_ORIGINS 列出的前端源。
  app.enableCors({
    origin: config.corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type'],
  });

  // 全局前缀 /api（契约 §0 Base URL）。
  app.setGlobalPrefix('api', {
    exclude: ['health', 'docs', 'docs-json'],
  });

  // Swagger（OpenAPI）契约：列全 21 个端点，与 docs/api-contract-v0.1.md 严格一致。
  const swaggerConfig = new DocumentBuilder()
    .setTitle('CampusGo 校园行 API')
    .setDescription('统一接口契约 v0.1（契约事实来源：docs/api-contract-v0.1.md）；21 个端点：4 Auth + 2 Users + 5 Content + 10 Admin')
    .setVersion('0.1')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(config.port);
  logger.log(`CampusGo server 已启动: http://localhost:${config.port}`);
  logger.log(`Swagger 地址: http://localhost:${config.port}/docs`);
}

bootstrap().catch((err) => {
  // 启动失败不打印敏感信息。
  // eslint-disable-next-line no-console
  console.error('服务启动失败:', err instanceof Error ? err.message : err);
  process.exit(1);
});
