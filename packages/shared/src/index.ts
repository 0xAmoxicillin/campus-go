// @campus-go/shared —— 前后端共用契约单一来源。
// 导出：角色/状态枚举、ErrorCode、统一响应体/分页、全部 DTO 的 TS 类型 + zod schema。
// 禁止前后端各写一份。与 docs/api-contract-v0.1.md 严格一致。

export * from './enums';
export * from './error-codes';
export * from './common';
export * from './auth';
export * from './users';
export * from './content';
export * from './admin';
