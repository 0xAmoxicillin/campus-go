/**
 * ============================================================================
 * M1 临时契约 shim（TEMPORARY CONTRACT SHIM）
 * ============================================================================
 * 本文件是 docs/api-contract-v0.1.md（统一接口契约 v0.1）的「前端临时副本」，
 * 用于 M1 在 packages/shared 尚未就绪（由后端工程师在并行 PR 中创建）之前
 * 先行并行开发。它是 M1 阶段的单一事实来源副本，**不是** 契约本身。
 *
 * 契约唯一事实来源：docs/api-contract-v0.1.md（禁止私自改字段）。
 *
 * ⚠️ M2 替换计划（由 @项目组长 统一安排）：
 *   1. 删除本文件与 src/contracts/ 下的 mock 相关 shim；
 *   2. 改为 `import type { ... } from '@campus-go/shared'`；
 *   3. 校验 shared 类型与本 shim 逐字段一致后，删除本文件头注释中的 TODO。
 *   替换不视为「违反契约单一来源」，因为 shared 与本文按同一契约生成。
 * ============================================================================
 */

/** 角色枚举（与契约 §1 一致，只有 USER / ADMIN 两种）。 */
export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

/** 用户状态。 */
export enum UserStatus {
  ACTIVE = 'ACTIVE',
  DISABLED = 'DISABLED',
}

/** 活动状态。 */
export enum ActivityStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

/** 资讯状态。 */
export enum PostStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

/**
 * 统一错误码（业务码；HTTP 状态码同步语义）。
 * 完整表见 docs/api-contract-v0.1.md §0。
 * 至少覆盖任务要求的 40100 / 40300 / 40001 / 40900。
 */
export enum ErrorCode {
  SUCCESS = 0,
  BAD_REQUEST = 40000,
  VALIDATION_FAILED = 40001,
  UNAUTHORIZED = 40100,
  TOKEN_EXPIRED = 40101,
  CREDENTIAL_ERROR = 40102,
  FORBIDDEN = 40300,
  NOT_FOUND = 40400,
  CONFLICT = 40900,
  RATE_LIMITED = 42900,
  INTERNAL = 50000,
}

/** 统一响应体：成功（data 为具体对象或 null）。 */
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

/** 分页载荷结构（与契约 §0 一致）。 */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** 统一分页响应体。 */
export type ApiPagedResponse<T> = ApiResponse<Paginated<T>>;

/**
 * 用户视图（契约 §3.1：绝不返回 passwordHash）。
 * ID 为 cuid 字符串，时间统一 ISO 8601（UTC，带 Z）。
 */
export interface UserView {
  id: string;
  email: string;
  name: string;
  role: Role;
  status: UserStatus;
  createdAt: string;
}

/** 报名记录视图（契约 §3.3）。 */
export interface EnrollmentView {
  id: string;
  userId: string;
  activityId: string;
  createdAt: string;
}

/** 活动视图（契约 §2 / §3.3）。 */
export interface ActivityView {
  id: string;
  title: string;
  summary: string;
  content: string;
  coverUrl: string;
  location: string;
  startAt: string;
  endAt: string;
  capacity: number;
  status: ActivityStatus;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

/** 资讯视图（契约 §2 / §3.3）。 */
export interface PostView {
  id: string;
  title: string;
  summary: string;
  content: string;
  coverUrl: string;
  status: PostStatus;
  createdById: string;
  createdAt: string;
  publishedAt: string;
}

// ---------------------------------------------------------------------------
// 请求体（入参），与契约 §3 严格一致
// ---------------------------------------------------------------------------

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
}

/** 注册/登录响应（含用户视图与令牌）。 */
export interface AuthResult {
  user: UserView;
  accessToken: string;
  refreshToken: string;
}

/**
 * 仅含令牌的响应（契约 §3.1：/auth/refresh 只返回令牌，不含 user）。
 * 与后端 packages/shared 的 authRefreshResponseSchema 对齐。
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UpdateMeRequest {
  /** 仅允许 name（契约 §3.2：email/role/status 不可在此改）。 */
  name: string;
}

export interface AdminUpdateUserRequest {
  status?: UserStatus;
  role?: Role;
}

export interface CreateActivityRequest {
  title: string;
  summary: string;
  content: string;
  coverUrl: string;
  location: string;
  startAt: string;
  endAt: string;
  capacity: number;
  /**
   * 必填：初始状态枚举（与后端 packages/shared 的 adminCreateActivityRequestSchema 对齐）。
   * 表单本就默认 DRAFT 且必填，不破坏交互。
   */
  status: ActivityStatus;
}

export interface CreatePostRequest {
  title: string;
  summary: string;
  content: string;
  coverUrl: string;
  /**
   * 必填：初始状态枚举（与后端 packages/shared 的 adminCreatePostRequestSchema 对齐）。
   * 表单本就默认 DRAFT 且必填，不破坏交互。
   */
  status: PostStatus;
}

/** 活动编辑请求（契约 §3.4：PATCH /admin/activities/:id，字段同创建但均可选）。 */
export interface UpdateActivityRequest {
  title?: string;
  summary?: string;
  content?: string;
  coverUrl?: string;
  location?: string;
  startAt?: string;
  endAt?: string;
  capacity?: number;
  status?: ActivityStatus;
}

/** 资讯编辑请求（契约 §3.4：PATCH /admin/posts/:id，字段同创建但均可选）。 */
export interface UpdatePostRequest {
  title?: string;
  summary?: string;
  content?: string;
  coverUrl?: string;
  status?: PostStatus;
}

// ---------------------------------------------------------------------------
// 分页查询参数（契约 §0：page/pageSize，pageSize 上限 100）
// ---------------------------------------------------------------------------

export interface ListQuery {
  page?: number;
  pageSize?: number;
  q?: string;
  role?: Role;
  status?: UserStatus;
}

/** 默认分页参数。 */
export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
