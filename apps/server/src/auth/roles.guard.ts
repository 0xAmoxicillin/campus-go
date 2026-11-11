import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@campus-go/shared';
import { ROLES_KEY } from './roles.decorator';
import { ApiException } from '../common/api-error';

/**
 * 角色守卫（安全红线之一）：已登录但角色不足 → 403 (code 40300)。
 * 要求 JwtAuthGuard 先于它执行（在 controller 上同时挂 @UseGuards(JwtAuthGuard, RolesGuard)）。
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user?.role) {
      throw ApiException.unauthorized();
    }
    if (!requiredRoles.includes(user.role)) {
      throw ApiException.forbidden();
    }
    return true;
  }
}
