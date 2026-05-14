import { useState } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff, Stethoscope } from 'lucide-react';
import { api, extractErrorMessage } from '../lib/api';
import { useAuthStore, homeByRole } from '../lib/auth-store';
import type { LoginResponse } from '../lib/types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPwd, setShowPwd] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(values: FormValues) {
    try {
      const { data } = await api.post<LoginResponse>('/auth/login', values);
      setAuth(data);
      toast.success(`Bienvenido, ${data.user.name}`);
      router.replace(homeByRole(data.user.role));
    } catch (err) {
      toast.error(extractErrorMessage(err, 'No se pudo iniciar sesión'));
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="p-3 bg-blue-100 rounded-full mb-3">
            <Stethoscope className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Prescripciones</h1>
          <p className="text-sm text-gray-500 mt-1">Inicia sesión para continuar</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              id="email"
              label="Email"
              type="email"
              placeholder="tu@email.com"
              autoComplete="email"
              {...register('email')}
              error={errors.email?.message}
            />

            <div className="relative">
              <Input
                id="password"
                label="Contraseña"
                type={showPwd ? 'text' : 'password'}
                autoComplete="current-password"
                {...register('password')}
                error={errors.password?.message}
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600"
                aria-label="Mostrar/ocultar contraseña"
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <Button type="submit" loading={isSubmitting} className="mt-2">
              Ingresar
            </Button>
          </form>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900">
          <p className="font-semibold mb-2">Cuentas de prueba:</p>
          <ul className="space-y-1 font-mono">
            <li>admin@test.com / admin123</li>
            <li>dr@test.com / dr123</li>
            <li>patient@test.com / patient123</li>
          </ul>
        </div>
      </div>
    </div>
  );
}