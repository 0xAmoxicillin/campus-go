import { z } from 'zod';
import { ROLE_VALUES, USER_STATUS_VALUES } from './enums';

// 密码规则（注册/登录）：≥8 位，含大小写字母与数字。
const passwordSchema = z
  .string()
  .min(8, '密码至少 8 位')
  .regex(/[a-z]/, '需包含小写字母')
  .regex(/[A-Z]/, '需包含大写字母')
  .regex(/\d/, '需包含数字');

// 用户视图（绝不返回 passwordHash）。
export const userViewSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(ROLE_VALUES),
  status: z.enum(USER_STATUS_VALUES),
  createdAt: z.string(),
});
export type UserView = z.infer<typeof userViewSchema>;

export const authTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});
export type AuthTokens = z.infer<typeof authTokensSchema>;

// 注册请求：仅 email / password / name，无 role（角色由服务端硬编码 USER）。
export const registerRequestSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
  name: z.string().min(1),
});
export type RegisterRequest = z.infer<typeof registerRequestSchema>;

export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const refreshRequestSchema = z.object({ refreshToken: z.string() });
export type RefreshRequest = z.infer<typeof refreshRequestSchema>;

export const logoutRequestSchema = z.object({ refreshToken: z.string() });
export type LogoutRequest = z.infer<typeof logoutRequestSchema>;

// 注册/登录成功返回：user + tokens。
export const authResultSchema = userViewSchema.merge(authTokensSchema);
export type AuthResult = z.infer<typeof authResultSchema>;
