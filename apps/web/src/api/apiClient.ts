import { ErrorCode, type ApiResponse } from '@/contracts/api-contract';
import { ApiError } from './errors';
import type { AdapterMethod, AdapterRequestInit, ApiAdapter } from './adapter';
import { createMockAdapter } from './mock';
import { getAccessToken } from './tokenStore';

// 可注入 baseURL 的真实 HTTP 适配器（M2 启用；M1 默认走 mock）。
// 统一响应体：解析 { code, message, data }，code !== 0 视为业务错误并抛 ApiError。
export function createHttpAdapter(baseURL: string): ApiAdapter {
  async function request<T>(path: string, init: AdapterRequestInit = {}): Promise<ApiResponse<T>> {
    const method: AdapterMethod = init.method ?? 'GET';
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (init.auth) {
      const token = getAccessToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    }
    const url = `${baseURL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
    const res = await fetch(url, {
      method,
      headers,
      body: init.body == null ? undefined : JSON.stringify(init.body),
    });
    // 非 2xx：尝试读取业务码，无法解析则按语义回退到错误码。
    if (!res.ok) {
      let code = res.status;
      let message = res.statusText || '请求失败';
      try {
        const body = (await res.json()) as ApiResponse<null>;
        if (typeof body?.code === 'number') {
          code = body.code;
          message = body.message || message;
        }
      } catch {
        /* 非 JSON 错误体，使用 HTTP 语义码 */
      }
      throw new ApiError(code, message);
    }
    const body = (await res.json()) as ApiResponse<T>;
    if (body.code !== ErrorCode.SUCCESS) {
      throw new ApiError(body.code, body.message || '业务错误');
    }
    return body;
  }
  return { request };
}

/**
 * 选择适配器：
 * - 默认 M1：USE_MOCK=true → mock adapter（不真实调用 /api）。
 * - 设置 VITE_USE_MOCK=false 并指向 VITE_API_BASE_URL → 真实后端。
 */
export function createApiClient(): ApiAdapter {
  const useMock = (import.meta.env.VITE_USE_MOCK ?? 'true') !== 'false';
  if (useMock) return createMockAdapter();
  const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001/api';
  return createHttpAdapter(baseURL);
}

// 默认实例（全应用共用）。
export const apiClient: ApiAdapter = createApiClient();
