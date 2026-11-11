import { beforeEach, describe, expect, it } from 'vitest';
import { authApi, usersApi, adminApi, activitiesApi, postsApi } from '@/api';
import { clearTokens } from '@/api/tokenStore';
import { ApiError } from '@/api/errors';
import { ErrorCode } from '@/contracts/api-contract';
import { DEMO_PASSWORD } from '@/api/mock/mockData';

beforeEach(() => clearTokens());

describe('统一响应体 / 分页 / 错误码（docs/api-contract-v0.1.md §0）', () => {
  it('公开列表返回 {code,message,data} 且 data 为分页结构 {items,total,page,pageSize}', async () => {
    const res = await activitiesApi.list({ page: 1, pageSize: 2 });
    expect(res).toHaveProperty('items');
    expect(res).toHaveProperty('total');
    expect(res).toHaveProperty('page', 1);
    expect(res).toHaveProperty('pageSize', 2);
    expect(Array.isArray(res.items)).toBe(true);
    expect(res.items.length).toBeLessThanOrEqual(2);
  });

  it('注册成功 code=0 且 user 视图不含 passwordHash（camelCase、cuid 风格 id）', async () => {
    const res = await authApi.register({
      email: `u${Date.now()}@campusgo.local`,
      password: DEMO_PASSWORD,
      name: '测试用户',
    });
    expect(res.user.role).toBe('USER'); // 安全红线：注册一律 USER
    expect(res.user).not.toHaveProperty('passwordHash');
    expect(res.user.id).toMatch(/^c/); // cuid 风格
  });

  it('重复邮箱注册 → 40900', async () => {
    await expect(
      authApi.register({ email: 'alice@campusgo.local', password: DEMO_PASSWORD, name: 'x' }),
    ).rejects.toMatchObject({ code: ErrorCode.CONFLICT });
  });

  it('密码不合规 → 40001', async () => {
    await expect(
      authApi.register({ email: 'z@campusgo.local', password: 'short', name: 'x' }),
    ).rejects.toMatchObject({ code: ErrorCode.VALIDATION_FAILED });
  });

  it('错误密码登录 → 40102', async () => {
    await expect(
      authApi.login({ email: 'alice@campusgo.local', password: 'WrongPass1' }),
    ).rejects.toMatchObject({ code: ErrorCode.CREDENTIAL_ERROR });
  });

  it('未登录访问 /users/me → 40100', async () => {
    await expect(usersApi.getMe()).rejects.toBeInstanceOf(ApiError);
    await expect(usersApi.getMe()).rejects.toMatchObject({ code: ErrorCode.UNAUTHORIZED });
  });

  it('USER 访问 /admin/** → 40300（RBAC 红线，体验层之外的真实拦截样本）', async () => {
    await authApi.login({ email: 'alice@campusgo.local', password: DEMO_PASSWORD });
    await expect(adminApi.listUsers()).rejects.toMatchObject({ code: ErrorCode.FORBIDDEN });
  });

  it('ADMIN 访问后台返回分页且可切换真实接口字段形态一致', async () => {
    await authApi.login({ email: 'admin@campusgo.local', password: DEMO_PASSWORD });
    const res = await adminApi.listUsers({ pageSize: 3 });
    expect(res).toHaveProperty('items');
    expect(res.items[0]).not.toHaveProperty('passwordHash');
  });

  it('报名去重 / 容量：重复报名同活动 → 40900', async () => {
    await authApi.login({ email: 'bob@campusgo.local', password: DEMO_PASSWORD });
    const list = await activitiesApi.list();
    const id = list.items[0].id;
    await activitiesApi.join(id); // 第一次
    await expect(activitiesApi.join(id)).rejects.toMatchObject({ code: ErrorCode.CONFLICT });
  });

  it('资讯列表同样遵循统一分页结构', async () => {
    const res = await postsApi.list({ pageSize: 2 });
    expect(res).toHaveProperty('total');
    expect(res).toHaveProperty('pageSize', 2);
  });
});
