import { z } from 'zod';
import { ACTIVITY_STATUS_VALUES, POST_STATUS_VALUES } from './enums';

export const activityViewSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  content: z.string(),
  coverUrl: z.string().nullable(),
  location: z.string().nullable(),
  startAt: z.string(),
  endAt: z.string(),
  capacity: z.number().int().nullable(),
  status: z.enum(ACTIVITY_STATUS_VALUES),
  createdById: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ActivityView = z.infer<typeof activityViewSchema>;

export const postViewSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  content: z.string(),
  coverUrl: z.string().nullable(),
  status: z.enum(POST_STATUS_VALUES),
  createdById: z.string().nullable(),
  createdAt: z.string(),
  publishedAt: z.string().nullable(),
});
export type PostView = z.infer<typeof postViewSchema>;

export const enrollmentViewSchema = z.object({
  id: z.string(),
  userId: z.string(),
  activityId: z.string(),
  createdAt: z.string(),
});
export type EnrollmentView = z.infer<typeof enrollmentViewSchema>;

// 公开内容列表查询：?page&pageSize&q。
export const contentListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  q: z.string().optional(),
});
export type ContentListQuery = z.infer<typeof contentListQuerySchema>;
