import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * 集中读取配置，全部来自环境变量（.env 不在仓库内，由全栈的一键环境提供）。
 * 默认值仅用于本地未配置时的兜底（非真实密钥）；部署前必须在 .env 覆盖 JWT_* 等敏感项。
 */
@Injectable()
export class AppConfigService {
  readonly env: string;
  readonly port: number;
  readonly databaseUrl: string;
  readonly jwtAccessSecret: string;
  readonly jwtRefreshSecret: string;
  readonly jwtAccessTtl: string;
  readonly jwtRefreshTtl: string;
  readonly corsOrigins: string[];
  readonly bcryptRounds: number;

  constructor(private readonly config: ConfigService) {
    this.env = this.config.get<string>('NODE_ENV', 'development');
    this.port = parseInt(this.config.get<string>('SERVER_PORT', '3001'), 10);
    this.databaseUrl = this.config.get<string>('DATABASE_URL', '');
    this.jwtAccessSecret = this.config.get<string>('JWT_ACCESS_SECRET', 'dev-access-secret');
    this.jwtRefreshSecret = this.config.get<string>('JWT_REFRESH_SECRET', 'dev-refresh-secret');
    this.jwtAccessTtl = this.config.get<string>('JWT_ACCESS_TTL', '15m');
    this.jwtRefreshTtl = this.config.get<string>('JWT_REFRESH_TTL', '7d');
    this.corsOrigins = (this.config.get<string>('CORS_ORIGINS', '') || 'http://localhost:5173')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    this.bcryptRounds = parseInt(this.config.get<string>('BCRYPT_ROUNDS', '10'), 10);
  }
}
