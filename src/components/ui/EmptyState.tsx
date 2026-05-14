import { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

interface Props {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="p-3 rounded-full bg-gray-100">
        <Inbox className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      {description && <p className="text-sm text-gray-500 max-w-md">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}