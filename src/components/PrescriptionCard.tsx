import Link from 'next/link';
import { ReactNode } from 'react';
import { StatusBadge } from './ui/Badge';
import { formatDateShort } from '@/lib/format';
import { Pill } from 'lucide-react';
import type { Prescription } from '@/lib/types';

interface Props {
  prescription: Prescription;
  /** Para mostrar paciente (vista del doctor) o médico (vista del paciente) */
  showPerson: 'patient' | 'doctor';
  /** Ruta de detalle, ej '/doctor/prescriptions/[id]' o '/patient/prescriptions/[id]' */
  detailHref: string;
  /** Slot para acciones extras (consumir, descargar PDF) */
  actions?: ReactNode;
}

export function PrescriptionCard({ prescription, showPerson, detailHref, actions }: Props) {
  const personName =
    showPerson === 'patient'
      ? prescription.patient.user.name
      : `Dr(a). ${prescription.author.user.name}`;
  const personLabel = showPerson === 'patient' ? 'Paciente' : 'Médico';

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-sm font-semibold text-gray-900">
              {prescription.code}
            </span>
            <StatusBadge status={prescription.status} />
          </div>

          <div className="text-sm text-gray-600 space-y-1">
            <div>
              <span className="text-gray-500">{personLabel}:</span>{' '}
              <span className="text-gray-900 font-medium">{personName}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span>Emitida: {formatDateShort(prescription.createdAt)}</span>
              <span className="flex items-center gap-1">
                <Pill className="w-3.5 h-3.5" />
                {prescription.items.length}{' '}
                {prescription.items.length === 1 ? 'medicamento' : 'medicamentos'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-row sm:flex-col gap-2 sm:items-end">
          <Link
            href={detailHref}
            className="inline-flex items-center justify-center px-3 py-1.5 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Ver detalle
          </Link>
          {actions}
        </div>
      </div>
    </div>
  );
}