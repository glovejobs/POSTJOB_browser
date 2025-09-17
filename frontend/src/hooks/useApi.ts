import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';

interface UseApiOptions {
  immediate?: boolean;
  cache?: boolean;
  cacheDuration?: number;
  retries?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  mutate: (newData: T) => void;
}

export function useApi<T = any>(
  url: string | (() => string | null) | null,
  options: UseApiOptions = {}
): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const {
    immediate = true,
    cache = true,
    cacheDuration,
    retries = 0,
    onSuccess,
    onError,
  } = options;

  // Store callbacks in refs to avoid dependency issues
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const optionsRef = useRef({ cache, cacheDuration, retries });

  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
    optionsRef.current = { cache, cacheDuration, retries };
  }, [onSuccess, onError, cache, cacheDuration, retries]);

  const fetchData = useCallback(async () => {
    const urlValue = typeof url === 'function' ? url() : url;

    if (!urlValue) {
      return;
    }

    // Abort previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const response = await (optionsRef.current.retries > 0
        ? api.retryRequest(() => api.get<T>(urlValue, {
            signal: abortControllerRef.current?.signal,
            cache: optionsRef.current.cache,
            cacheDuration: optionsRef.current.cacheDuration,
          }), optionsRef.current.retries)
        : api.get<T>(urlValue, {
            signal: abortControllerRef.current?.signal,
            cache: optionsRef.current.cache,
            cacheDuration: optionsRef.current.cacheDuration,
          }));

      setData(response);
      onSuccessRef.current?.(response);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err);
        onErrorRef.current?.(err);
      }
    } finally {
      setLoading(false);
    }
  }, [url]); // Only depend on url, not callbacks

  useEffect(() => {
    // Only fetch if URL is available and immediate is true
    const urlValue = typeof url === 'function' ? url() : url;

    if (immediate && urlValue) {
      fetchData();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, fetchData, immediate]); // Run when dependencies change

  const refetch = useCallback(() => {
    const urlValue = typeof url === 'function' ? url() : url;
    if (urlValue) {
      api.invalidateCache(urlValue);
    }
    return fetchData();
  }, [fetchData]);

  const mutate = useCallback((newData: T) => {
    setData(newData);
  }, []);

  return { data, loading, error, refetch, mutate };
}

// Hook for mutations (POST, PUT, DELETE)
interface UseMutationOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: any) => void;
  optimistic?: boolean;
}

interface UseMutationResult<T, V> {
  mutate: (variables: V) => Promise<T>;
  loading: boolean;
  error: Error | null;
  data: T | null;
  reset: () => void;
}

export function useMutation<T = any, V = any>(
  mutationFn: (variables: V) => Promise<T>,
  options: UseMutationOptions<T> = {}
): UseMutationResult<T, V> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { onSuccess, onError } = options;

  const mutate = useCallback(
    async (variables: V) => {
      setLoading(true);
      setError(null);

      try {
        const result = await mutationFn(variables);
        setData(result);
        onSuccess?.(result);
        return result;
      } catch (err: any) {
        setError(err);
        onError?.(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [mutationFn, onSuccess, onError]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { mutate, loading, error, data, reset };
}

// Hook for polling
export function usePolling<T = any>(
  url: string,
  intervalMs: number,
  shouldContinue: (data: T) => boolean,
  options: UseApiOptions = {}
): UseApiResult<T> & { stop: () => void; start: () => void } {
  const [isPolling, setIsPolling] = useState(true);
  const result = useApi<T>(url, { ...options, immediate: false });
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const start = useCallback(() => {
    setIsPolling(true);
  }, []);

  const stop = useCallback(() => {
    setIsPolling(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isPolling) {
      // Initial fetch
      result.refetch();

      // Set up polling
      intervalRef.current = setInterval(async () => {
        await result.refetch();

        if (result.data && !shouldContinue(result.data)) {
          stop();
        }
      }, intervalMs);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPolling, intervalMs, result, shouldContinue, stop]);

  return { ...result, stop, start };
}

// Hook for infinite scroll / pagination
interface UsePaginatedResult<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function usePaginated<T = any>(
  baseUrl: string,
  pageSize = 20
): UsePaginatedResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.get<{ data: T[]; hasMore: boolean }>(
        `${baseUrl}?page=${page}&limit=${pageSize}`
      );

      setData(prev => [...prev, ...response.data]);
      setHasMore(response.hasMore);
      setPage(prev => prev + 1);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [baseUrl, page, pageSize, loading, hasMore]);

  const refresh = useCallback(async () => {
    setData([]);
    setPage(1);
    setHasMore(true);
    await loadMore();
  }, [loadMore]);

  return { data, loading, error, hasMore, loadMore, refresh };
}

// Hook for WebSocket subscriptions
export function useWebSocket<T = any>(
  url: string,
  options: {
    onMessage?: (data: T) => void;
    onError?: (error: Event) => void;
    onOpen?: () => void;
    onClose?: () => void;
    autoReconnect?: boolean;
    reconnectInterval?: number;
  } = {}
) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<T | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    onMessage,
    onError,
    onOpen,
    onClose,
    autoReconnect = true,
    reconnectInterval = 3000,
  } = options;

  const connect = useCallback(() => {
    try {
      wsRef.current = new WebSocket(url);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        onOpen?.();
      };

      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data) as T;
        setLastMessage(data);
        onMessage?.(data);
      };

      wsRef.current.onerror = (error) => {
        onError?.(error);
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        onClose?.();

        if (autoReconnect) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };
    } catch (error) {
      console.error('WebSocket connection error:', error);
    }
  }, [url, onMessage, onError, onOpen, onClose, autoReconnect, reconnectInterval]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { isConnected, lastMessage, sendMessage, disconnect, reconnect: connect };
}