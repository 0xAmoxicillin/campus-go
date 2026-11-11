import { z } from 'zod';

// 分页元信息（data 内的分页对象）。
export const paginationMetaSchema = z.object({
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
});
export type PaginationMeta = z.infer<typeof paginationMetaSchema>;

// 统一响应体：{ code, message, data }
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// 分页结构：{ items, total, page, pageSize }
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// 成功响应构造器。
export function success<T>(data: T, message = 'ok'): ApiResponse<T> {
  return { code: 0, message, data };
}

// 通用分页查询参数（?page=1&pageSize=20，pageSize 上限 100）。
export const pageQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});
export type PageQuery = z.infer<typeof pageQuerySchema>;
