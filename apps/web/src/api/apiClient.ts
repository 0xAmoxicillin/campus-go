import { ErrorCode, type ApiResponse } from '@/contracts/api-contract';
import { ApiError } from './errors';
import type { AdapterMethod, AdapterRequestInit, ApiAdapter } from './adapter';
import { createMockAdapter } from './mock';
import { getAccessToken, getRefreshToken, setTokens } from './tokenStore';

// 可注入 baseURL 的真实 HTTP 适配器（M2 默认启用；保留可注入性便于测试/切换）。
// 统一响应体：解析 { code, message, data }，code !== 0 视为业务错误并抛 ApiError。
// 可选：access token 过期（40100/40101）时静默刷新一次后重试（避免用户被踢出）。
export function createHttpAdapter(baseURL: string): ApiAdapter {
  // 刷新并发保护：同一时刻只进行一次静默刷新。
  let refreshPromise: Promise<boolean> | null = null;

  async function trySilentRefresh(): Promise<boolean> {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;
    if (refreshPromise) return refreshPromise;
    refreshPromise = (async () => {
      try {
        const res = await fetch(`${baseURL.replace(/\/$/, '')}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) return false;
        const body = (await res.json()) as ApiResponse<{ accessToken: string; refreshToken: string }>;
        if (body?.code !== ErrorCode.SUCCESS || !body.data) return false;
        setTokens(body.data.accessToken, body.data.refreshToken);
        return true;
      } catch {
        return false;
      } finally {
        refreshPromise = null;
      }
    })();
    return refreshPromise;
  }

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

    // 非 2xx：尝试读取业务码，无法解析则按 HTTP 语义回退到错误码。
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

      // access 过期或失效且非刷新接口自身 → 静默刷新一次后重试原请求。
      const expired = code === ErrorCode.TOKEN_EXPIRED || code === ErrorCode.UNAUTHORIZED;
      const isRefreshCall = path.includes('/auth/refresh');
      if (expired && !isRefreshCall && init.auth) {
        const refreshed = await trySilentRefresh();
        if (refreshed) {
          const token = getAccessToken();
          if (token) headers.Authorization = `Bearer ${token}`;
          const retry = await fetch(url, {
            method,
            headers,
            body: init.body == null ? undefined : JSON.stringify(init.body),
          });
          if (retry.ok) {
            const rb = (await retry.json()) as ApiResponse<T>;
            if (rb.code !== ErrorCode.SUCCESS) throw new ApiError(rb.code, rb.message || '业务错误');
            return rb;
          }
          try {
            const rb = (await retry.json()) as ApiResponse<null>;
            if (typeof rb?.code === 'number') {
              code = rb.code;
              message = rb.message || message;
            }
          } catch {
            /* 重试响应也非 JSON，沿用原 code */
          }
        }
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
 * - 默认 M2：走真实后端（VITE_USE_MOCK 不置 true 即为真实）。
 * - 设置 VITE_USE_MOCK=true → 回退 mock adapter（后端未起时的本地演示/回退）。
 */
export function createApiClient(): ApiAdapter {
  const useMock = (import.meta.env.VITE_USE_MOCK ?? 'false') === 'true';
  if (useMock) return createMockAdapter();
  const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001/api';
  return createHttpAdapter(baseURL);
}

// 默认实例（全应用共用）。
export const apiClient: ApiAdapter = createApiClient();
