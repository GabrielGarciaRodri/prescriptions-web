import { useRouter } from 'next/router';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { RouteGuard } from '@/components/RouteGuard';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatusBadge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { useQuery } from '@/lib/use-query';
import { formatDate } from '@/lib/format';
import type { Prescription } from '@/lib/types';

export default function DoctorPrescriptionDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const url = typeof id === 'string' ? `/prescriptions/${id}` : null;
  const { data, loading, error } = useQuery<Prescription>(url, [url]);

  return (
    <RouteGuard allowedRoles={['doctor']}>
      <AppLayout>
        <Link
          href="/doctor/prescriptions"
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
          <DetailContent prescription={data} />
        )}
      </AppLayout>
    </RouteGuard>
  );
}

function DetailContent({ prescription }: { prescription: Prescription }) {
  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-gray-900 font-mono">{prescription.code}</h1>
        <StatusBadge status={prescription.status} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-2">Paciente</h3>
          <p className="font-medium text-gray-900">{prescription.patient.user.name}</p>
          <p className="text-sm text-gray-600">{prescription.patient.user.email}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-2">Fecha de emisión</h3>
          <p className="font-medium text-gray-900">{formatDate(prescription.createdAt)}</p>
          {prescription.consumedAt && (
            <p className="text-sm text-green-700 mt-1">
              Consumida el {formatDate(prescription.consumedAt)}
            </p>
          )}
        </div>
      </div>

      {prescription.notes && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-2">Notas</h3>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{prescription.notes}</p>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-base font-semibold text-gray-900 mb-3">
          Medicamentos ({prescription.items.length})
        </h3>
        <div className="space-y-3">
          {prescription.items.map((item, idx) => (
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
  );
}