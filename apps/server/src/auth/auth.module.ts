import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';

/**
 * 鉴权基础设施模块（全局）：注册 JWT 策略、JwtAuthGuard、RolesGuard。
 * 业务 AuthModule（M2）将在此之上实现 register/login/refresh/logout 与 bcrypt+JWT 配置。
 * 注意：本模块不自行提供 APP_GUARD，避免全局强制鉴权影响公开端点；
 *       各 controller 显式 @UseGuards(JwtAuthGuard, RolesGuard) 才是安全边界（契约 §1）。
 */
@Global()
@Module({
  imports: [ConfigModule, PassportModule],
  providers: [JwtStrategy, JwtAuthGuard, RolesGuard],
  exports: [JwtAuthGuard, RolesGuard, JwtStrategy],
})
export class AuthInfraModule {}
