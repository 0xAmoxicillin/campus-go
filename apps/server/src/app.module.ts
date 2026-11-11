import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module';
import { AppConfigService } from './config/config.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthInfraModule } from './auth/auth.module';
import { AuthController } from './auth/auth.controller';
import { UsersController } from './users/users.controller';
import { ContentController } from './content/content.controller';
import { AdminController } from './admin/admin.controller';

/**
 * M1 应用根模块：仅装配「契约 + schema + 基础设施 + Swagger」。
 * 业务服务（AuthService / UsersService / AdminService）在 M2 单独 PR 实现。
 */
@Module({
  imports: [AppConfigModule, PrismaModule, AuthInfraModule],
  controllers: [AuthController, UsersController, ContentController, AdminController],
})
export class AppModule {
  constructor(private readonly config: AppConfigService) {}
}
