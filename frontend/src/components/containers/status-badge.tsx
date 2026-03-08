import { Badge } from '@/components/ui/badge';
import type { ContainerStatus } from '@/types';

const STATUS_CONFIG: Record<
  ContainerStatus,
  { label: string; className: string }
> = {
  EMPTY: {
    label: 'Empty',
    className: 'bg-gray-100 text-gray-600 hover:bg-gray-100',
  },
  HAS_MEDIA: {
    label: 'Has Media',
    className: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
  },
  HAS_CULTURE: {
    label: 'Culture',
    className: 'bg-green-100 text-green-700 hover:bg-green-100',
  },
  DISCARDED: {
    label: 'Discarded',
    className: 'bg-neutral-200 text-neutral-600 hover:bg-neutral-200',
  },
};

export function StatusBadge({ status }: { status: ContainerStatus }) {
  const config = STATUS_CONFIG[status];
  return <Badge className={config.className}>{config.label}</Badge>;
}
