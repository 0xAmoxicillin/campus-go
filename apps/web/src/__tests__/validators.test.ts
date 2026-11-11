import { describe, expect, it } from 'vitest';
import { registerSchema, loginSchema, passwordSchema } from '@/lib/validators';

// 表单校验（与契约 §3.1 一致）：邮箱格式 + 密码 ≥8 位含大小写与数字。
// 注意：使用普通字面量作为用例，避免 `{{SECRET_*}}` 占位符本身恰含大小写与数字而误判。
describe('注册/登录表单校验', () => {
  it('合规密码通过', () => {
    expect(passwordSchema.safeParse('CampusGo123').success).toBe(true);
  });
  it('短密码不通过', () => {
    expect(passwordSchema.safeParse('Ab1').success).toBe(false);
  });
  it('全小写无数字不通过', () => {
    expect(passwordSchema.safeParse('abcdefgh').success).toBe(false);
  });
  it('含大小写但缺数字不通过', () => {
    expect(passwordSchema.safeParse('Abcdefgh').success).toBe(false);
  });
  it('非法邮箱不通过', () => {
    expect(registerSchema.safeParse({ name: 'x', email: 'bad', password: 'CampusGo123' }).success).toBe(false);
  });
  it('合规注册通过', () => {
    expect(registerSchema.safeParse({ name: 'x', email: 'a@b.com', password: 'CampusGo123' }).success).toBe(true);
  });
  it('登录仅需邮箱格式 + 非空密码', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: 'x' }).success).toBe(true);
  });
});
