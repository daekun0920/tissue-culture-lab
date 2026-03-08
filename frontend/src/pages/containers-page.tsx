import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ContainerCard } from '@/components/containers/container-card';
import { useContainers } from '@/hooks/use-containers';
import type { ContainerStatus } from '@/types';

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'EMPTY', label: 'Empty' },
  { value: 'HAS_MEDIA', label: 'Has Media' },
  { value: 'HAS_CULTURE', label: 'Has Culture' },
  { value: 'DISCARDED', label: 'Discarded' },
];

export default function ContainersPage() {
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const queryStatus: ContainerStatus | undefined =
    selectedStatus === 'ALL' ? undefined : (selectedStatus as ContainerStatus);

  const { data: containers, isLoading } = useContainers(queryStatus);

  // Filter overdue
  const overdue = (containers ?? []).filter(
    (c) =>
      c.status === 'HAS_CULTURE' &&
      c.dueSubcultureDate &&
      new Date(c.dueSubcultureDate) < new Date(),
  );

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Containers</h2>

      <Tabs value={selectedStatus} onValueChange={setSelectedStatus} className="mb-6">
        <TabsList className="bg-gray-100">
          {STATUS_FILTERS.map((filter) => (
            <TabsTrigger key={filter.value} value={filter.value} className="text-xs">
              {filter.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {selectedStatus === 'ALL' && overdue.length > 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700 font-medium">
            {overdue.length} container{overdue.length !== 1 ? 's' : ''} overdue for subculture
          </p>
        </div>
      )}

      {isLoading && <p className="text-gray-500">Loading...</p>}

      {!isLoading && containers && containers.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-400 text-sm">
            No containers found{selectedStatus !== 'ALL' ? ` with status "${selectedStatus}"` : ''}.
          </p>
        </div>
      )}

      {!isLoading && containers && containers.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {containers.map((container) => (
            <ContainerCard key={container.qrCode} container={container} />
          ))}
        </div>
      )}
    </div>
  );
}
