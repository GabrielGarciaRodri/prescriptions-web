import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ArrowLeft, Check, Download } from 'lucide-react';
import { toast } from 'sonner';
import { RouteGuard } from '@/components/RouteGuard';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatusBadge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { api, downloadFile, extractErrorMessage } from '@/lib/api';
import { useQuery } from '@/lib/use-query';
import { formatDate } from '@/lib/format';
import type { Prescription } from '@/lib/types';

export default function PatientPrescriptionDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const url = typeof id === 'string' ? `/prescriptions/${id}` : null;
  const { data, loading, error, refetch } = useQuery<Prescription>(url, [url]);

  const [busy, setBusy] = useState(false);

  async function handleConsume() {
    if (!data) return;
    if (!confirm(`¿Confirmas que recibiste la prescripción ${data.code}?`)) return;
    setBusy(true);
    try {
      await api.put(`/prescriptions/${data.id}/consume`);
      toast.success('Prescripción marcada como consumida');
      await refetch();
    } catch (err) {
      toast.error(extractErrorMessage(err, 'No se pudo marcar como consumida'));
    } finally {
      setBusy(false);
    }
  }

  async function handleDownload() {
    if (!data) return;
    setBusy(true);
    try {
      await downloadFile(`/prescriptions/${data.id}/pdf`, `${data.code}.pdf`);
    } catch (err) {
      toast.error(extractErrorMessage(err, 'No se pudo descargar el PDF'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <RouteGuard allowedRoles={['patient']}>
      <AppLayout>
        <Link
          href="/patient/prescriptions"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al listado
        </Link>

        {loading && <Spinner />}

        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        {data && !loading && (
          <div className="space-y-5 max-w-4xl">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900 font-mono">{data.code}</h1>
                <StatusBadge status={data.status} />
              </div>
              <div className="flex gap-2">
                {data.status === 'pending' && (
                  <Button onClick={handleConsume} loading={busy}>
                    <Check className="w-4 h-4" />
                    Marcar como consumida
                  </Button>
                )}
                <Button variant="secondary" onClick={handleDownload} loading={busy}>
                  <Download className="w-4 h-4" />
                  Descargar PDF
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-2">Médico</h3>
                <p className="font-medium text-gray-900">
                  Dr(a). {data.author.user.name}
                </p>
                {data.author.specialty && (
                  <p className="text-sm text-gray-600">{data.author.specialty}</p>
                )}
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-2">
                  Fecha de emisión
                </h3>
                <p className="font-medium text-gray-900">{formatDate(data.createdAt)}</p>
                {data.consumedAt && (
                  <p className="text-sm text-green-700 mt-1">
                    Consumida el {formatDate(data.consumedAt)}
                  </p>
                )}
              </div>
            </div>

            {data.notes && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-2">Notas</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{data.notes}</p>
              </div>
            )}

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-base font-semibold text-gray-900 mb-3">
                Medicamentos ({data.items.length})
              </h3>
              <div className="space-y-3">
                {data.items.map((item, idx) => (
                  <div key={item.id} className="border border-gray-100 rounded-md p-3 bg-gray-50">
                    <p className="font-medium text-gray-900 mb-1">
                      {idx + 1}. {item.name}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-600">
                      {item.dosage && (
                        <div>
                          <span className="text-gray-500">Dosis:</span> {item.dosage}
                        </div>
                      )}
                      {item.quantity != null && (
                        <div>
                          <span className="text-gray-500">Cantidad:</span> {item.quantity}
                        </div>
                      )}
                      {item.instructions && (
                        <div>
                          <span className="text-gray-500">Instrucciones:</span> {item.instructions}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </AppLayout>
    </RouteGuard>
  );
}