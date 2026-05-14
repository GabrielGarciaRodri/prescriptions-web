import { useRouter } from 'next/router';
import { Button } from './ui/Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  page: number;
  totalPages: number;
  total: number;
}

export function Pagination({ page, totalPages, total }: Props) {
  const router = useRouter();

  function goTo(newPage: number) {
    const newQuery: Record<string, string> = {};
    Object.entries(router.query).forEach(([k, v]) => {
      if (typeof v === 'string') newQuery[k] = v;
    });
    newQuery.page = String(newPage);
    router.replace({ pathname: router.pathname, query: newQuery });
  }

  if (totalPages <= 1) {
    return (
      <div className="flex justify-center text-sm text-gray-500 py-4">
        {total} {total === 1 ? 'resultado' : 'resultados'}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 py-4">
      <span className="text-sm text-gray-500">
        Página {page} de {totalPages} · {total} resultados
      </span>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => goTo(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => goTo(page + 1)}
          disabled={page >= totalPages}
        >
          Siguiente
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}