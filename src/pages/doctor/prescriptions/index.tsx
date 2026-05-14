import { useRouter } from 'next/router';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { RouteGuard } from '@/components/RouteGuard';
import { AppLayout } from '@/components/layout/AppLayout';
import { PrescriptionFilters } from '@/components/PrescriptionFilters';
import { PrescriptionCard } from '@/components/PrescriptionCard';
import { Pagination } from '@/components/Pagination';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { useQuery } from '@/lib/use-query';
import type { Paginated, Prescription } from '@/lib/types';

function buildUrl(query: Record<string, string | string[] | undefined>): string {
  const params = new URLSearchParams();
  params.set('mine', 'true');
  ['status', 'from', 'to', 'page', 'limit'].forEach((k) => {
    const v = query[k];
    if (typeof v === 'string' && v) params.set(k, v);
  });
  return `/prescriptions?${params.toString()}`;
}

export default function DoctorPrescriptionsPage() {
  const router = useRouter();
  const url = buildUrl(router.query);

  const { data, loading, error, refetch } = useQuery<Paginated<Prescription>>(url, [url]);

  return (
    <RouteGuard allowedRoles={['doctor']}>
      <AppLayout>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mis prescripciones</h1>
            <p className="text-sm text-gray-500 mt-1">
              Prescripciones que has emitido a tus pacientes
            </p>
          </div>
          <Link href="/doctor/prescriptions/new">
            <Button>
              <Plus className="w-4 h-4" />
              Nueva prescripción
            </Button>
          </Link>
        </div>

        <PrescriptionFilters />

        {loading && <Spinner />}

        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
            {error}
            <button onClick={refetch} className="ml-2 underline">
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && data && (
          <>
            {data.data.length === 0 ? (
              <EmptyState
                title="No hay prescripciones"
                description="No has emitido prescripciones que coincidan con los filtros aplicados."
                action={
                  <Link href="/doctor/prescriptions/new">
                    <Button>
                      <Plus className="w-4 h-4" />
                      Crear la primera
                    </Button>
                  </Link>
                }
              />
            ) : (
              <>
                <div className="space-y-3">
                  {data.data.map((p) => (
                    <PrescriptionCard
                      key={p.id}
                      prescription={p}
                      showPerson="patient"
                      detailHref={`/doctor/prescriptions/${p.id}`}
                    />
                  ))}
                </div>
                <Pagination
                  page={data.meta.page}
                  totalPages={data.meta.totalPages}
                  total={data.meta.total}
                />
              </>
            )}
          </>
        )}
      </AppLayout>
    </RouteGuard>
  );
}