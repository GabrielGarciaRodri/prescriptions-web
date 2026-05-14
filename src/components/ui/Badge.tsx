import clsx from 'clsx';
import type { PrescriptionStatus } from '../../lib/types';

interface Props {
  status: PrescriptionStatus;
}

export function StatusBadge({ status }: Props) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        {
          'bg-yellow-100 text-yellow-800': status === 'pending',
          'bg-green-100 text-green-800': status === 'consumed',
        },
      )}
    >
      {status === 'pending' ? 'Pendiente' : 'Consumida'}
    </span>
  );
}