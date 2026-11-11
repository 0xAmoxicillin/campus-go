import type { ApiResponse } from '@/contracts/api-contract';

/** 适配器请求方法（仅用到的子集）。 */
export type AdapterMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export interface AdapterRequestInit {
  method?: AdapterMethod;
  body?: unknown;
  /** 是否需要在请求头携带 Bearer（真实客户端据此附加 Authorization）。 */
  auth?: boolean;
}

/**
 * 可注入的 API 适配器接口。
 * - 真实实现：基于 fetch，拼接到 VITE_API_BASE_URL，解析统一响应体，非 0 码抛 ApiError。
 * - M1 实现：mock adapter（src/api/mock.ts），完全按 docs/api-contract-v0.1.md 构造响应形状。
 *
 * 约定：成功 resolve 为 ApiResponse<T>；业务错误（code !== 0）reject 为 ApiError，
 * 以兼容「fetch → 校验 code → 抛错」的统一处理路径。
 */
export interface ApiAdapter {
  request<T>(path: string, init?: AdapterRequestInit): Promise<ApiResponse<T>>;
}
