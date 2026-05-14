import { useState } from 'react';
import { useRouter } from 'next/router';
import { Check, Download } from 'lucide-react';
import { toast } from 'sonner';
import { RouteGuard } from '@/components/RouteGuard';
import { AppLayout } from '@/components/layout/AppLayout';
import { PrescriptionFilters } from '@/components/PrescriptionFilters';
import { PrescriptionCard } from '@/components/PrescriptionCard';
import { Pagination } from '@/components/Pagination';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { api, downloadFile, extractErrorMessage } from '@/lib/api';
import { useQuery } from '@/lib/use-query';
import type { Paginated, Prescription } from '@/lib/types';

function buildUrl(query: Record<string, string | string[] | undefined>): string {
  const params = new URLSearchParams();
  ['status', 'page', 'limit'].forEach((k) => {
    const v = query[k];
    if (typeof v === 'string' && v) params.set(k, v);
  });
  const qs = params.toString();
  return `/me/prescriptions${qs ? `?${qs}` : ''}`;
}

export default function PatientPrescriptionsPage() {
  const router = useRouter();
  const url = buildUrl(router.query);
  const { data, loading, error, refetch } = useQuery<Paginated<Prescription>>(url, [url]);

  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleConsume(id: string, code: string) {
    if (!confirm(`¿Confirmas que recibiste la prescripción ${code}?`)) return;
    setBusyId(id);
    try {
      await api.put(`/prescriptions/${id}/consume`);
      toast.success('Prescripción marcada como consumida');
      await refetch();
    } catch (err) {
      toast.error(extractErrorMessage(err, 'No se pudo marcar como consumida'));
    } finally {
      setBusyId(null);
    }
  }

  async function handleDownload(id: string, code: string) {
    setBusyId(id);
    try {
      await downloadFile(`/prescriptions/${id}/pdf`, `${code}.pdf`);
    } catch (err) {
      toast.error(extractErrorMessage(err, 'No se pudo descargar el PDF'));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <RouteGuard allowedRoles={['patient']}>
      <AppLayout>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Mis prescripciones</h1>
          <p className="text-sm text-gray-500 mt-1">
            Prescripciones médicas que has recibido
          </p>
        </div>

        <PrescriptionFilters showDateFilters={false} />

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
                title="No tienes prescripciones"
                description="Aún no has recibido prescripciones médicas."
              />
            ) : (
              <>
                <div className="space-y-3">
                  {data.data.map((p) => (
                    <PrescriptionCard
                      key={p.id}
                      prescription={p}
                      showPerson="doctor"
                      detailHref={`/patient/prescriptions/${p.id}`}
                      actions={
                        <div className="flex gap-2">
                          {p.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleConsume(p.id, p.code)}
                              loading={busyId === p.id}
                            >
                              <Check className="w-4 h-4" />
                              Consumir
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleDownload(p.id, p.code)}
                            loading={busyId === p.id}
                          >
                            <Download className="w-4 h-4" />
                            PDF
                          </Button>
                        </div>
                      }
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