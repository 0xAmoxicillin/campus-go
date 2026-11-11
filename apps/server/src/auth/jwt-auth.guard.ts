import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiException } from '../common/api-error';

/**
 * 接口级鉴权边界（安全红线之一）：未登录 / token 缺失或无效 → 401 (code 40100)。
 * 与 @Roles 结合使用时，RolesGuard 负责越权（403）。两者均挂在 /api/admin/** 上。
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // 让 passport 抛出的异常统一走 ApiExceptionFilter，保证 { code, message, data } 形态。
  handleRequest(err: any, user: any, _info: any, _context: any, _status?: any) {
    if (err || !user) {
      throw ApiException.unauthorized();
    }
    return user;
  }
}
