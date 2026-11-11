import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AppConfigService } from '../config/config.service';
import { ApiException } from '../common/api-error';

export interface JwtPayload {
  sub: string;
  role: string;
  type: 'access' | 'refresh';
}

/**
 * Access Token 策略。refresh token 不用于访问受保护资源。
 * token 缺失/无效/过期 → 401（code 40100 / 40101）。token 类型非 access → 40100。
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: AppConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.jwtAccessSecret,
    });
  }

  validate(payload: JwtPayload) {
    if (!payload?.sub) {
      throw new UnauthorizedException();
    }
    if (payload.type !== 'access') {
      throw ApiException.unauthorized('请使用 access token');
    }
    return { userId: payload.sub, role: payload.role };
  }
}
