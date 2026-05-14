import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore, homeByRole, selectIsAuthenticated } from '../lib/auth-store';
import { Spinner } from './ui/Spinner';
import type { Role } from '../lib/types';

interface Props {
  allowedRoles?: Role[];
  children: ReactNode;
}

/**
 * Envuelve páginas protegidas. Valida:
 * 1. Que el store ya esté hidratado (sino esperamos)
 * 2. Que haya sesión, sino → /login
 * 3. Que el rol esté permitido, sino → home del rol actual
 */
export function RouteGuard({ allowedRoles, children }: Props) {
  const router = useRouter();
  const hydrated = useAuthStore((s) => s.hydrated);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!hydrated) return;

    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      router.replace(homeByRole(user.role));
    }
  }, [hydrated, isAuthenticated, user, allowedRoles, router]);

  // Mientras hidrata o estamos por redirigir, mostramos spinner
  if (!hydrated || !isAuthenticated) {
    return <Spinner label="Verificando sesión..." />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Spinner label="Redirigiendo..." />;
  }

  return <>{children}</>;
}