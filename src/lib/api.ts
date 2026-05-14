import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from './auth-store';
import type { RefreshResponse } from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Cliente separado SIN interceptor para hacer el refresh.
 * Si usáramos `api` para llamar a /auth/refresh, entraríamos en un loop infinito
 * cuando el refresh devuelva 401.
 */
const refreshClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: inyecta el access token en cada request
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Manejo de 401 con queue:
 * - Si llega un 401, intentamos refrescar.
 * - Si MIENTRAS se refresca llegan más 401, los ponemos en cola.
 * - Cuando el refresh termina, se libera la cola con el nuevo token.
 * - Si el refresh falla, se rechazan todos.
 *
 * Esto evita race conditions donde varios requests simultáneos disparen
 * múltiples refreshes (rotación los rechazaría como reuso).
 */
let isRefreshing = false;
type QueueItem = {
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
};
let queue: QueueItem[] = [];

function flushQueue(error: unknown, token: string | null) {
  queue.forEach((p) => {
    if (error || !token) p.reject(error);
    else p.resolve(token);
  });
  queue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Solo intentamos refresh en 401, una sola vez por request, y no para el endpoint
    // de login/refresh (que también podrían dar 401 por credenciales inválidas)
    const isAuthEndpoint =
      original?.url?.includes('/auth/login') || original?.url?.includes('/auth/refresh');

    if (error.response?.status !== 401 || original?._retry || isAuthEndpoint) {
      return Promise.reject(error);
    }

    const { refreshToken, setTokens, clearAuth } = useAuthStore.getState();
    if (!refreshToken) {
      clearAuth();
      return Promise.reject(error);
    }

    original._retry = true;

    if (isRefreshing) {
      // Hay un refresh en curso: nos quedamos esperando
      return new Promise((resolve, reject) => {
        queue.push({
          resolve: (newToken: string) => {
            original.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(original));
          },
          reject,
        });
      });
    }

    isRefreshing = true;
    try {
      const { data } = await refreshClient.post<RefreshResponse>('/auth/refresh', {
        refreshToken,
      });
      setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      original.headers.Authorization = `Bearer ${data.accessToken}`;
      flushQueue(null, data.accessToken);
      return api(original);
    } catch (refreshError) {
      flushQueue(refreshError, null);
      clearAuth();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

/**
 * Helper para extraer mensaje legible de un error de la API.
 */
export function extractErrorMessage(err: unknown, fallback = 'Ocurrió un error'): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string | string[] } | undefined;
    if (data?.message) {
      return Array.isArray(data.message) ? data.message.join(', ') : data.message;
    }
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

/**
 * Helper para descargar un blob (usado en el PDF).
 */
export async function downloadFile(url: string, filename: string): Promise<void> {
  const response = await api.get(url, { responseType: 'blob' });
  const blob = new Blob([response.data], { type: 'application/pdf' });
  const objectUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(objectUrl);
}