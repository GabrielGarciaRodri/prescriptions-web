import { useEffect, useState, useCallback, useRef } from 'react';
import { api, extractErrorMessage } from './api';

interface UseQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook simple para hacer GET. Refetch automático cuando cambia la url o las deps.
 * Suficiente para una prueba técnica; en producción usaríamos React Query/SWR.
 */
export function useQuery<T>(url: string | null, deps: unknown[] = []): UseQueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(!!url);
  const [error, setError] = useState<string | null>(null);
  // Para evitar set-state después de unmount
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const fetcher = useCallback(async () => {
    if (!url) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<T>(url);
      if (mounted.current) setData(res.data);
    } catch (err) {
      if (mounted.current) setError(extractErrorMessage(err));
    } finally {
      if (mounted.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, ...deps]);

  useEffect(() => {
    fetcher();
  }, [fetcher]);

  return { data, loading, error, refetch: fetcher };
}