import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/containers/status-badge';
import { cn } from '@/lib/utils';
import type { Container, ContainerStatus } from '@/types';

const BORDER_COLORS: Record<ContainerStatus, string> = {
  EMPTY: 'border-l-gray-400',
  HAS_MEDIA: 'border-l-amber-400',
  HAS_CULTURE: 'border-l-green-500',
  DISCARDED: 'border-l-neutral-400',
};

export function ContainerCard({ container }: { container: Container }) {
  const borderClass = BORDER_COLORS[container.status];
  const isOverdue =
    container.status === 'HAS_CULTURE' &&
    container.dueSubcultureDate &&
    new Date(container.dueSubcultureDate) < new Date();

  const displayName =
    container.culture?.name ??
    container.media?.recipe?.name ??
    null;

  return (
    <Link to={`/containers/${encodeURIComponent(container.qrCode)}`}>
      <Card
        className={cn(
          'border-l-4 hover:shadow-md transition-shadow cursor-pointer',
          borderClass,
          isOverdue && 'ring-2 ring-red-300',
        )}
      >
        <CardContent className="p-4 flex flex-col gap-2">
          <div className="flex items-start justify-between">
            <StatusBadge status={container.status} />
            <span className="text-xs text-gray-400">
              {new Date(container.updatedAt).toLocaleDateString()}
            </span>
          </div>

          {displayName && (
            <p className="text-sm font-medium text-gray-800 truncate">
              {displayName}
            </p>
          )}

          {isOverdue && (
            <p className="text-xs text-red-500 font-medium">Overdue</p>
          )}

          <p className="text-xs font-mono text-gray-500 text-right mt-auto">
            {container.qrCode}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
