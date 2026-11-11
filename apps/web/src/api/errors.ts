import { ErrorCode } from '@/contracts/api-contract';

/**
 * API 业务错误。对应契约 §0 的「统一错误码」：
 * 服务端在 HTTP 语义状态之外，额外返回 `code`（业务码）/ `message` / `data:null`。
 * 本类仅承载业务码与消息，不携带任何敏感字段。
 */
export class ApiError extends Error {
  readonly code: number;

  constructor(code: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }

  /** 是否为未登录 / token 失效（401 家族）。 */
  isUnauthorized(): boolean {
    return (
      this.code === ErrorCode.UNAUTHORIZED ||
      this.code === ErrorCode.TOKEN_EXPIRED ||
      this.code === ErrorCode.CREDENTIAL_ERROR
    );
  }

  /** 是否为越权（RBAC 红线，40300）。 */
  isForbidden(): boolean {
    return this.code === ErrorCode.FORBIDDEN;
  }
}
