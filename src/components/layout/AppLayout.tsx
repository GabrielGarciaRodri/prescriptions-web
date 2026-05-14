import { ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '../../lib/auth-store';
import { api } from '../../lib/api';
import { LogOut, Stethoscope } from 'lucide-react';
import { Button } from '../ui/Button';

interface Props {
  children: ReactNode;
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  doctor: 'Médico',
  patient: 'Paciente',
};

export function AppLayout({ children }: Props) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  async function handleLogout() {
    try {
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch {
      // ignoramos errores del logout en backend, igual limpiamos local
    } finally {
      clearAuth();
      router.replace('/login');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-6 h-6 text-blue-600" />
              <span className="font-semibold text-gray-900">Prescripciones</span>
            </div>

            <div className="flex items-center gap-4">
              {user && (
                <div className="hidden sm:flex flex-col items-end leading-tight">
                  <span className="text-sm font-medium text-gray-900">{user.name}</span>
                  <span className="text-xs text-gray-500">{ROLE_LABELS[user.role]}</span>
                </div>
              )}
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Salir</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</main>
    </div>
  );
}