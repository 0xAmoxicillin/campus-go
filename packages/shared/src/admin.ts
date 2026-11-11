import { z } from 'zod';
import {
  ROLE_VALUES,
  USER_STATUS_VALUES,
  ACTIVITY_STATUS_VALUES,
  POST_STATUS_VALUES,
} from './enums';

// GET /api/admin/users?page&pageSize&role&status&q
export const adminUserListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  role: z.enum(ROLE_VALUES).optional(),
  status: z.enum(USER_STATUS_VALUES).optional(),
  q: z.string().optional(),
});
export type AdminUserListQuery = z.infer<typeof adminUserListQuerySchema>;

// PATCH /api/admin/users/:id —— 启停 / 改角色（至少其一，由服务端校验）。
export const adminUpdateUserRequestSchema = z.object({
  status: z.enum(USER_STATUS_VALUES).optional(),
  role: z.enum(ROLE_VALUES).optional(),
});
export type AdminUpdateUserRequest = z.infer<typeof adminUpdateUserRequestSchema>;

export const adminCreateActivityRequestSchema = z.object({
  title: z.string().min(1),
  summary: z.string(),
  content: z.string(),
  coverUrl: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  startAt: z.string(),
  endAt: z.string(),
  capacity: z.number().int().positive().nullable().optional(),
  status: z.enum(ACTIVITY_STATUS_VALUES),
});
export type AdminCreateActivityRequest = z.infer<typeof adminCreateActivityRequestSchema>;

export const adminUpdateActivityRequestSchema = adminCreateActivityRequestSchema.partial();
export type AdminUpdateActivityRequest = z.infer<typeof adminUpdateActivityRequestSchema>;

export const adminCreatePostRequestSchema = z.object({
  title: z.string().min(1),
  summary: z.string(),
  content: z.string(),
  coverUrl: z.string().nullable().optional(),
  status: z.enum(POST_STATUS_VALUES),
  publishedAt: z.string().nullable().optional(),
});
export type AdminCreatePostRequest = z.infer<typeof adminCreatePostRequestSchema>;

export const adminUpdatePostRequestSchema = adminCreatePostRequestSchema.partial();
export type AdminUpdatePostRequest = z.infer<typeof adminUpdatePostRequestSchema>;
