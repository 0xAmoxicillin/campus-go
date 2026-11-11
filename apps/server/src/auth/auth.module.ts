import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { AuthService } from './auth.service';

/**
 * 鉴权基础设施模块（全局）：注册 JWT 策略、JwtAuthGuard、RolesGuard，
 * 并暴露业务 AuthService（M2 实现的 register/login/refresh/logout）。
 * 注意：本模块不自行提供 APP_GUARD，避免全局强制鉴权影响公开端点；
 *       各 controller 显式 @UseGuards(JwtAuthGuard, RolesGuard) 才是安全边界（契约 §1）。
 */
@Global()
@Module({
  imports: [ConfigModule, PassportModule],
  providers: [JwtStrategy, JwtAuthGuard, RolesGuard, AuthService],
  exports: [JwtAuthGuard, RolesGuard, JwtStrategy, AuthService],
})
export class AuthInfraModule {}
