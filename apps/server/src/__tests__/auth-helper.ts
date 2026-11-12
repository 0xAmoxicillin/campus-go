import request from 'supertest';
import { TestApp } from './test-app';
import { User } from '@prisma/client';

/**
 * 测试用：为给定用户签发一个真实 access token（走 register→refresh，mock 层不连库）。
 * 正确模拟两组 Prisma 调用：
 *  - user.findUnique：register 查重按 email 返回 null；refresh 查用户按 id 返回目标用户；
 *  - refreshToken 表：create 落库、findUnique 按 tokenHash 查、update 置 revokedAt。
 */
export function installAuthMocks(ctx: TestApp, targetUser: User): void {
  const store = new Map<string, any>();

  ctx.prisma.refreshToken.create.mockImplementation(async ({ data }: any) => {
    const rec = { id: `rt_${Math.random()}`, ...data, revokedAt: null };
    store.set(data.tokenHash, rec);
    return rec;
  });
  ctx.prisma.refreshToken.findUnique.mockImplementation(async ({ where }: any) =>
    store.get(where.tokenHash) ?? null,
  );
  ctx.prisma.refreshToken.update.mockImplementation(async ({ where, data }: any) => {
    const rec = store.get(where.tokenHash);
    if (rec) Object.assign(rec, data);
    return rec;
  });

  ctx.prisma.user.findUnique.mockImplementation(async ({ where }: any) => {
    // register 用 email 查重 → 视为全新用户
    if (where.email !== undefined) return null;
    // refresh 用 id 取用户
    return where.id === targetUser.id ? targetUser : null;
  });
  ctx.prisma.user.create.mockImplementation(async ({ data }: any) =>
    ({ ...targetUser, email: data.email, name: data.name, role: data.role }) as any,
  );
}

/** 为 targetUser 签发 access token（返回字符串）。每次调用用全新邮箱注册以避免冲突。 */
export async function issueAccessToken(ctx: TestApp, targetUser: User): Promise<string> {
  installAuthMocks(ctx, targetUser);
  const email = `t_${Date.now()}_${Math.random()}@campus.edu`;
  const reg = await request(ctx.app.getHttpServer())
    .post('/api/auth/register')
    .send({ email, password: 'Passw0rd', name: 'tester' });
  const rt = reg.body.data.refreshToken;
  const r = await request(ctx.app.getHttpServer())
    .post('/api/auth/refresh')
    .send({ refreshToken: rt });
  return r.body.data.accessToken as string;
}
