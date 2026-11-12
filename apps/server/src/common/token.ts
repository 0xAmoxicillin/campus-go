import { createHash } from 'crypto';

/**
 * 刷新令牌只存哈希（契约 §2 RefreshToken.tokenHash，绝不落明文）。
 */
export function sha256Token(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

/**
 * 把 '15m' / '7d' / '30s' / '100' 这类 JWT TTL 解析为毫秒，
 * 用于计算 RefreshToken.expiresAt（与 config 中 JWT_REFRESH_TTL 对齐）。
 */
export function parseTtlToMs(ttl: string): number {
  const match = /^(\d+)\s*(ms|s|m|h|d)?$/.exec((ttl ?? '').trim());
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const n = parseInt(match[1], 10);
  switch (match[2]) {
    case 'ms':
      return n;
    case 's':
      return n * 1000;
    case 'm':
      return n * 60 * 1000;
    case 'h':
      return n * 60 * 60 * 1000;
    case 'd':
      return n * 24 * 60 * 60 * 1000;
    default:
      return n;
  }
}
