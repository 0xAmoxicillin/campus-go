import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiException } from '../common/api-error';

/**
 * 登录限流守卫（自包含，无外部依赖）：对公开高频端点（登录/刷新/注册）按客户端 IP 限流。
 * 超限 → 429 (code 42900)。默认 10 次 / 60 秒，可用环境变量 LOGIN_THROTTLE_LIMIT / LOGIN_THROTTLE_TTL 调整。
 *
 * 说明：采用进程内存计数，单实例足够 M1；多实例部署需改用共享存储（如 Redis）。
 */
@Injectable()
export class LoginThrottlerGuard implements CanActivate {
  private readonly logger = new Logger(LoginThrottlerGuard.name);
  private readonly hits = new Map<string, { count: number; resetAt: number }>();

  private readonly limit = parseInt(process.env.LOGIN_THROTTLE_LIMIT ?? '10', 10);
  private readonly ttlMs = parseInt(process.env.LOGIN_THROTTLE_TTL ?? '60', 10) * 1000;

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const key = this.clientKey(req);
    const now = Date.now();
    const entry = this.hits.get(key);

    if (!entry || entry.resetAt <= now) {
      this.hits.set(key, { count: 1, resetAt: now + this.ttlMs });
      return true;
    }
    if (entry.count >= this.limit) {
      this.logger.warn(`登录限流触发：client=${key}`);
      throw ApiException.tooManyRequests();
    }
    entry.count += 1;
    return true;
  }

  private clientKey(req: Request): string {
    const fwd = req.headers['x-forwarded-for'];
    const ip = (Array.isArray(fwd) ? fwd[0] : fwd) || req.socket.remoteAddress || 'unknown';
    return `login:${ip}`;
  }
}
