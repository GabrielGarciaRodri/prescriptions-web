import { Loader2 } from 'lucide-react';

export function Spinner({ label = 'Cargando...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-gray-500">
      <Loader2 className="w-8 h-8 animate-spin" />
      <p className="text-sm">{label}</p>
    </div>
  );
}