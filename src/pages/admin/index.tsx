import { useRouter } from 'next/router';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from 'recharts';
import { Users, Stethoscope, FileText, Calendar } from 'lucide-react';
import { RouteGuard } from '@/components/RouteGuard';
import { AppLayout } from '@/components/layout/AppLayout';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { useQuery } from '@/lib/use-query';
import type { AdminMetrics } from '@/lib/types';
import { ChangeEvent } from 'react';

function buildUrl(query: Record<string, string | string[] | undefined>): string {
  const params = new URLSearchParams();
  ['from', 'to'].forEach((k) => {
    const v = query[k];
    if (typeof v === 'string' && v) params.set(k, v);
  });
  const qs = params.toString();
  return `/admin/metrics${qs ? `?${qs}` : ''}`;
}

const STATUS_COLORS = {
  pending: '#ca8a04',
  consumed: '#16a34a',
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const url = buildUrl(router.query);
  const { data, loading, error, refetch } = useQuery<AdminMetrics>(url, [url]);

  function updateDate(key: 'from' | 'to', value: string) {
    const newQuery: Record<string, string> = {};
    Object.entries(router.query).forEach(([k, v]) => {
      if (typeof v === 'string') newQuery[k] = v;
    });
    if (value) newQuery[key] = value;
    else delete newQuery[key];
    router.replace({ pathname: router.pathname, query: newQuery });
  }

  return (
    <RouteGuard allowedRoles={['admin']}>
      <AppLayout>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Métricas del sistema de prescripciones</p>
        </div>

        {/* Filtros */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filtro de fechas</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600">Desde</label>
              <input
                type="date"
                value={(router.query.from as string) ?? ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) => updateDate('from', e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600">Hasta</label>
              <input
                type="date"
                value={(router.query.to as string) ?? ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) => updateDate('to', e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              {(router.query.from || router.query.to) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.replace({ pathname: router.pathname, query: {} })}
                >
                  Limpiar
                </Button>
              )}
            </div>
          </div>
        </div>

        {loading && <Spinner />}

        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
            {error}
            <button onClick={refetch} className="ml-2 underline">
              Reintentar
            </button>
          </div>
        )}

        {data && !loading && (
          <div className="space-y-6">
            {/* Totales */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <MetricCard
                label="Médicos"
                value={data.totals.doctors}
                icon={<Stethoscope className="w-5 h-5" />}
                color="text-blue-600 bg-blue-100"
              />
              <MetricCard
                label="Pacientes"
                value={data.totals.patients}
                icon={<Users className="w-5 h-5" />}
                color="text-green-600 bg-green-100"
              />
              <MetricCard
                label="Prescripciones"
                value={data.totals.prescriptions}
                icon={<FileText className="w-5 h-5" />}
                color="text-purple-600 bg-purple-100"
              />
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Por estado</h3>
                {data.byStatus.pending === 0 && data.byStatus.consumed === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-12">
                    Sin datos en el rango seleccionado
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Pendientes', value: data.byStatus.pending, key: 'pending' },
                          { name: 'Consumidas', value: data.byStatus.consumed, key: 'consumed' },
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        dataKey="value"
                        label={(entry) => `${entry.name}: ${entry.value}`}
                      >
                        <Cell fill={STATUS_COLORS.pending} />
                        <Cell fill={STATUS_COLORS.consumed} />
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <h3 className="text-base font-semibold text-gray-900 mb-4">
                  Prescripciones por día
                </h3>
                {data.byDay.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-12">
                    Sin datos en el rango seleccionado
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={data.byDay}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11 }}
                        tickFormatter={(d: string) => d.slice(5)}
                      />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Top doctores */}
            {data.topDoctors.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <h3 className="text-base font-semibold text-gray-900 mb-4">
                  Top médicos por volumen
                </h3>
                <div className="space-y-2">
                  {data.topDoctors.map((d, idx) => (
                    <div
                      key={d.doctorId}
                      className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{d.name}</p>
                          {d.specialty && (
                            <p className="text-xs text-gray-500">{d.specialty}</p>
                          )}
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {d.count} prescripciones
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </AppLayout>
    </RouteGuard>
  );
}

function MetricCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-md ${color}`}>{icon}</div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}