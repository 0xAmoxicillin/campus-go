import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { AuthTokens, LoginRequest, RegisterRequest, UserView } from '@campus-go/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AppConfigService } from '../config/config.service';
import { ApiException } from '../common/api-error';
import { sha256Token, parseTtlToMs } from '../common/token';
import { toUserView } from '../common/views';
import { User, Role } from '@prisma/client';

export interface AuthResultView {
  user: UserView;
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  private readonly jwt: JwtService;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
  ) {
    this.jwt = new JwtService();
  }

  /** 注册：role 由服务端硬编码 USER（红线：忽略请求体中的 role）。 */
  async register(dto: RegisterRequest): Promise<AuthResultView> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw ApiException.conflict('邮箱已注册');
    }
    const passwordHash = await bcrypt.hash(dto.password, this.config.bcryptRounds);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
        role: Role.USER, // 红线：硬编码 USER，绝不接受请求体 role
      },
    });
    return this.issueTokens(user);
  }

  async login(dto: LoginRequest): Promise<AuthResultView> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    // 统一 40102，避免用户枚举；DISABLED 同样拒绝登录。
    if (!user) {
      throw ApiException.invalidCredentials();
    }
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw ApiException.invalidCredentials();
    }
    if (user.status !== 'ACTIVE') {
      throw ApiException.invalidCredentials('账号已被停用');
    }
    return this.issueTokens(user);
  }

  /** 刷新（轮换）：校验 refresh 令牌（签名/过期/吊销/哈希），签发新对，旧令牌置 revokedAt。 */
  async refresh(refreshToken: string): Promise<AuthTokens> {
    let payload: { sub: string; type: string };
    try {
      payload = this.jwt.verify<{ sub: string; type: string }>(refreshToken, {
        secret: this.config.jwtRefreshSecret,
      });
    } catch {
      throw ApiException.unauthorized('refresh token 无效或已过期');
    }
    if (payload.type !== 'refresh' || !payload.sub) {
      throw ApiException.unauthorized('refresh token 类型错误');
    }

    const tokenHash = sha256Token(refreshToken);
    const record = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!record || record.revokedAt) {
      throw ApiException.unauthorized('refresh token 已吊销');
    }
    if (record.expiresAt.getTime() <= Date.now()) {
      throw ApiException.unauthorized('refresh token 已过期');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.status !== 'ACTIVE') {
      throw ApiException.unauthorized('账号不存在或已停用');
    }

    // 轮换：先吊销旧令牌，再签发新对（旧 token 立即失效）。
    await this.prisma.refreshToken.update({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    });
    return this.issueTokensPair(user);
  }

  /** 登出：吊销指定的 refresh 令牌。 */
  async logout(refreshToken: string): Promise<void> {
    const tokenHash = sha256Token(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async issueTokens(user: User): Promise<AuthResultView> {
    const { accessToken, refreshToken } = await this.issueTokensPair(user);
    return { user: toUserView(user), accessToken, refreshToken };
  }

  /** 仅签发令牌对（不附带 user 视图），供 refresh 轮换使用。 */
  private async issueTokensPair(user: User): Promise<AuthTokens> {
    const accessToken = this.jwt.sign(
      { sub: user.id, role: user.role, type: 'access' },
      { secret: this.config.jwtAccessSecret, expiresIn: this.config.jwtAccessTtl },
    );
    // 刷新令牌携带随机 jti，保证每次签发哈希唯一（避免与旧令牌哈希碰撞，
    // 否则会因 RefreshToken.tokenHash @unique 在数据库层冲突，且旧令牌无法被轮换吊销）。
    const refreshToken = this.jwt.sign(
      { sub: user.id, role: user.role, type: 'refresh', jti: randomUUID() },
      { secret: this.config.jwtRefreshSecret, expiresIn: this.config.jwtRefreshTtl },
    );
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: sha256Token(refreshToken), // 只存哈希
        expiresAt: new Date(Date.now() + parseTtlToMs(this.config.jwtRefreshTtl)),
      },
    });
    return { accessToken, refreshToken };
  }
}
