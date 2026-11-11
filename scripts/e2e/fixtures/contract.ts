// ---------------------------------------------------------------------------
// 契约类型与常量（M1 E2E 骨架）
//
// 事实来源：docs/api-contract-v0.1.md
// 这里只定义「断言用的形状」，不替代 packages/shared（后端 M1 落地的 DTO/zod）。
// M3 接入真实服务后，E2E 可直接改用 @campus-go/shared 导出的类型。
// ---------------------------------------------------------------------------

/** 统一响应体 {code, message, data} —— 契约 §0 */
export interface ApiEnvelope<T = unknown> {
  code: number;
  message: string;
  data: T;
}

/** 分页 data {items,total,page,pageSize} —— 契约 §0 */
export interface PageData<T = unknown> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type Role = 'USER' | 'ADMIN';

/** 统一错误码（节选，契约 §0 错误码表）—— E2E 红线只用到 40100 / 40300 */
export const ErrorCode = {
  OK: 0,
  BAD_REQUEST: 40000,
  VALIDATION_FAILED: 40001,
  UNAUTHORIZED: 40100, // 未登录 / token 缺失或无效
  TOKEN_EXPIRED: 40101,
  BAD_CREDENTIALS: 40102,
  FORBIDDEN: 40300, // 越权（角色不足）—— RBAC 红线
  NOT_FOUND: 40400,
  CONFLICT: 40900,
  TOO_MANY_REQUESTS: 42900,
  INTERNAL: 50000,
} as const;

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode];

export interface ErrorLike {
  code: ErrorCodeValue;
  message: string;
}

/** 契约中两条安全红线的标准错误响应 —— 契约 §1 / §3.4 */
export const RED_LINES = {
  unauthenticated: {
    http: 401,
    body: { code: ErrorCode.UNAUTHORIZED, message: '未登录或 token 无效', data: null },
  },
  forbidden: {
    http: 403,
    body: { code: ErrorCode.FORBIDDEN, message: '权限不足', data: null },
  },
} as const;

/** 断言：一个对象是否符合统一响应体形状 */
export function isEnvelope(v: unknown): v is ApiEnvelope {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.code === 'number' &&
    typeof o.message === 'string' &&
    'data' in o
  );
}

/** 断言：data 是否符合分页结构 */
export function isPageData(v: unknown): v is PageData {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    Array.isArray(o.items) &&
    typeof o.total === 'number' &&
    typeof o.page === 'number' &&
    typeof o.pageSize === 'number'
  );
}
