import { useRouter } from 'next/router';
import { ChangeEvent } from 'react';
import { Button } from './ui/Button';
import { Filter, X } from 'lucide-react';

interface Props {
  showDateFilters?: boolean;
}

export function PrescriptionFilters({ showDateFilters = true }: Props) {
  const router = useRouter();
  const { status, from, to } = router.query;

  function updateQuery(patch: Record<string, string | undefined>) {
    const newQuery: Record<string, string> = {};
    Object.entries(router.query).forEach(([k, v]) => {
      if (typeof v === 'string') newQuery[k] = v;
    });
    Object.entries(patch).forEach(([k, v]) => {
      if (v === undefined || v === '') {
        delete newQuery[k];
      } else {
        newQuery[k] = v;
      }
    });
    // Resetear página al cambiar filtros
    delete newQuery.page;

    router.replace(
      { pathname: router.pathname, query: newQuery },
      undefined,
      { shallow: false },
    );
  }

  function handleStatus(e: ChangeEvent<HTMLSelectElement>) {
    updateQuery({ status: e.target.value || undefined });
  }

  function handleFrom(e: ChangeEvent<HTMLInputElement>) {
    updateQuery({ from: e.target.value || undefined });
  }

  function handleTo(e: ChangeEvent<HTMLInputElement>) {
    updateQuery({ to: e.target.value || undefined });
  }

  function clearAll() {
    router.replace({ pathname: router.pathname, query: {} });
  }

  const hasFilters = !!(status || from || to);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Filtros</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-600">Estado</label>
          <select
            value={(status as string) ?? ''}
            onChange={handleStatus}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos</option>
            <option value="pending">Pendientes</option>
            <option value="consumed">Consumidas</option>
          </select>
        </div>

        {showDateFilters && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600">Desde</label>
              <input
                type="date"
                value={(from as string) ?? ''}
                onChange={handleFrom}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600">Hasta</label>
              <input
                type="date"
                value={(to as string) ?? ''}
                onChange={handleTo}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </>
        )}

        <div className="flex items-end">
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearAll}>
              <X className="w-4 h-4" />
              Limpiar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}