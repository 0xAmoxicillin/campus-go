import { z } from 'zod';

// 与 docs/api-contract-v0.1.md §3.1 一致：
// 邮箱格式校验；密码 ≥8 位且含大小写字母与数字。
export const emailSchema = z.string().min(1, '请输入邮箱').email('邮箱格式不正确');

export const passwordSchema = z
  .string()
  .min(8, '密码至少 8 位')
  .regex(/[a-z]/, '需包含小写字母')
  .regex(/[A-Z]/, '需包含大写字母')
  .regex(/\d/, '需包含数字');

export const registerSchema = z.object({
  name: z.string().min(1, '请输入昵称').max(40, '昵称过长'),
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, '请输入密码'),
});

export const updateMeSchema = z.object({
  name: z.string().min(1, '请输入昵称').max(40, '昵称过长'),
});

export type RegisterValues = z.infer<typeof registerSchema>;
export type LoginValues = z.infer<typeof loginSchema>;
export type UpdateMeValues = z.infer<typeof updateMeSchema>;
