import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module';
import { AppConfigService } from './config/config.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthInfraModule } from './auth/auth.module';
import { AuthController } from './auth/auth.controller';
import { UsersModule } from './users/users.module';
import { ContentModule } from './content/content.module';
import { AdminModule } from './admin/admin.module';

/**
 * 应用根模块（M2）：装配基础设施 + 真实业务模块。
 * 各 controller 由其所在 feature module 注册（AuthController 在 AuthInfraModule，
 * 其余在 Users/Content/Admin 模块），避免重复注册导致 DI 解析歧义。
 */
@Module({
  imports: [
    AppConfigModule,
    PrismaModule,
    AuthInfraModule,
    UsersModule,
    ContentModule,
    AdminModule,
  ],
  controllers: [AuthController],
})
export class AppModule {
  constructor(private readonly config: AppConfigService) {}
}
