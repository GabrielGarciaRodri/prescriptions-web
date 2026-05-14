import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore, homeByRole, selectIsAuthenticated } from '../lib/auth-store';
import { Spinner } from '../components/ui/Spinner';

export default function Home() {
  const router = useRouter();
  const hydrated = useAuthStore((s) => s.hydrated);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const role = useAuthStore((s) => s.user?.role);

  useEffect(() => {
    if (!hydrated) return;
    if (isAuthenticated && role) {
      router.replace(homeByRole(role));
    } else {
      router.replace('/login');
    }
  }, [hydrated, isAuthenticated, role, router]);

  return <Spinner label="Cargando..." />;
}