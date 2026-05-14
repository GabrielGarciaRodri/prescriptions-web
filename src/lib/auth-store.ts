import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser, Role } from './types';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  // hidratación del persist: hasta que termina, no sabemos si hay sesión
  hydrated: boolean;

  setAuth: (data: { accessToken: string; refreshToken: string; user: AuthUser }) => void;
  setTokens: (data: { accessToken: string; refreshToken: string }) => void;
  clearAuth: () => void;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      hydrated: false,

      setAuth: ({ accessToken, refreshToken, user }) =>
        set({ accessToken, refreshToken, user }),

      setTokens: ({ accessToken, refreshToken }) =>
        set({ accessToken, refreshToken }),

      clearAuth: () =>
        set({ accessToken: null, refreshToken: null, user: null }),

      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'prescriptions-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);

/**
 * Selectores convenientes (evitan re-renders innecesarios cuando otras partes del store cambian)
 */
export const selectIsAuthenticated = (s: AuthState) => !!s.accessToken && !!s.user;
export const selectRole = (s: AuthState): Role | null => s.user?.role ?? null;

/**
 * Helper para obtener la home según el rol del usuario.
 */
export function homeByRole(role: Role | null | undefined): string {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'doctor':
      return '/doctor/prescriptions';
    case 'patient':
      return '/patient/prescriptions';
    default:
      return '/login';
  }
}