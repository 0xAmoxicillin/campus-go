import { useCallback, useEffect, useRef, useState } from 'react';
import type { ListQuery, Paginated } from '@/contracts/api-contract';
import { ApiError } from '@/api/errors';

/** 受控输入防抖（搜索框用）。 */
export function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/**
 * 通用分页列表状态机：分页 + 关键词搜索（防抖）+ 加载/错误态 + 重新拉取。
 * 三个后台模块（用户 / 活动 / 资讯）共用。
 *
 * 注意：fetcher 可能每次渲染都是新函数（内联箭头），故存入 ref、不参与依赖，
 * 避免「渲染 → 依赖变化 → 重新拉取 → setState → 再渲染」的无限循环。
 */
export function usePaginatedList<T>(
  fetcher: (q: ListQuery) => Promise<Paginated<T>>,
  pageSize = 8,
) {
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const reqId = useRef(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const debouncedQuery = useDebounced(query, 300);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  // 搜索变化重置到第 1 页。
  useEffect(() => {
    setPage(1);
  }, [debouncedQuery]);

  useEffect(() => {
    const id = ++reqId.current;
    setLoading(true);
    setError(null);
    fetcherRef.current({ page, pageSize, q: debouncedQuery || undefined })
      .then((res) => {
        if (id !== reqId.current) return;
        setItems(res.items);
        setTotal(res.total);
      })
      .catch((e: unknown) => {
        if (id !== reqId.current) return;
        if (e instanceof ApiError) setError(e.message);
        else setError('加载失败，请确认后端服务已启动（或设置 VITE_USE_MOCK=true 回退本地 mock）');
      })
      .finally(() => {
        if (id !== reqId.current) return;
        setLoading(false);
      });
  }, [page, pageSize, debouncedQuery, nonce]);

  return { items, total, page, setPage, query, setQuery, loading, error, reload };
}
