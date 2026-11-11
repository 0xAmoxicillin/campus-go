import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * 取出 JwtStrategy.validate 注入的当前用户 { userId, role }。
 * 配合 @UseGuards(JwtAuthGuard) 使用；未登录时守卫已先行拦截（401）。
 */
export const AuthUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
