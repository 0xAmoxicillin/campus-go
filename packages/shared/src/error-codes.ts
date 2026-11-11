// 统一业务错误码 —— 与 docs/api-contract-v0.1.md §0 严格一致。
// `code` 为业务码，HTTP 状态码同步语义（见 HTTP_STATUS_BY_ERROR_CODE）。

export const ErrorCode = {
  SUCCESS: 0,
  BAD_REQUEST: 40000,
  VALIDATION_FAILED: 40001,
  UNAUTHORIZED: 40100,
  TOKEN_EXPIRED: 40101,
  INVALID_CREDENTIALS: 40102,
  FORBIDDEN: 40300,
  NOT_FOUND: 40400,
  CONFLICT: 40900,
  TOO_MANY_REQUESTS: 42900,
  INTERNAL: 50000,
} as const;

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode];

// HTTP 状态码与业务码的映射（用于异常过滤器统一响应体）。
export const HTTP_STATUS_BY_ERROR_CODE: Record<number, number> = {
  [ErrorCode.BAD_REQUEST]: 400,
  [ErrorCode.VALIDATION_FAILED]: 400,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.TOKEN_EXPIRED]: 401,
  [ErrorCode.INVALID_CREDENTIALS]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.CONFLICT]: 409,
  [ErrorCode.TOO_MANY_REQUESTS]: 429,
  [ErrorCode.INTERNAL]: 500,
};
