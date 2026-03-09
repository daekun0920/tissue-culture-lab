import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
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
  const navigate = useNavigate();
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedQrs, setSelectedQrs] = useState<Set<string>>(new Set());

  const queryStatus: ContainerStatus | undefined =
    selectedStatus === 'ALL' ? undefined : (selectedStatus as ContainerStatus);

  const { data: containers, isLoading, isError } = useContainers(queryStatus);

  // Filter overdue
  const overdue = (containers ?? []).filter(
    (c) =>
      c.status === 'HAS_CULTURE' &&
      c.dueSubcultureDate &&
      new Date(c.dueSubcultureDate) < new Date(),
  );

  const visibleQrs = useMemo(
    () => new Set((containers ?? []).map((c) => c.qrCode)),
    [containers],
  );

  const toggleSelect = useCallback((qr: string) => {
    setSelectedQrs((prev) => {
      const next = new Set(prev);
      if (next.has(qr)) next.delete(qr);
      else next.add(qr);
      return next;
    });
  }, []);

  const selectAllVisible = useCallback(() => {
    setSelectedQrs(visibleQrs);
  }, [visibleQrs]);

  const deselectAll = useCallback(() => {
    setSelectedQrs(new Set());
  }, []);

  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false);
    setSelectedQrs(new Set());
  }, []);

  const handlePerformAction = useCallback(() => {
    const qrCodes = Array.from(selectedQrs);
    if (qrCodes.length === 0) return;
    navigate('/operations', { state: { qrCodes } });
  }, [selectedQrs, navigate]);

  // Count how many selected are still visible (filter might hide some)
  const activeSelectedCount = useMemo(
    () => Array.from(selectedQrs).filter((qr) => visibleQrs.has(qr)).length,
    [selectedQrs, visibleQrs],
  );

  return (
    <div className="pb-24">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Containers</h2>
        <Button
          variant={selectionMode ? 'default' : 'outline'}
          size="sm"
          onClick={() => (selectionMode ? exitSelectionMode() : setSelectionMode(true))}
        >
          {selectionMode ? 'Cancel Selection' : 'Select'}
        </Button>
      </div>

      <Tabs value={selectedStatus} onValueChange={setSelectedStatus} className="mb-6">
        <TabsList className="bg-gray-100">
          {STATUS_FILTERS.map((filter) => (
            <TabsTrigger key={filter.value} value={filter.value} className="text-xs">
              {filter.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {selectionMode && containers && containers.length > 0 && (
        <div className="flex items-center gap-3 mb-4 text-sm">
          <span className="text-gray-500">
            {selectedQrs.size} selected
          </span>
          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={selectAllVisible}>
            Select all ({containers.length})
          </Button>
          {selectedQrs.size > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={deselectAll}>
              Deselect all
            </Button>
          )}
        </div>
      )}

      {selectedStatus === 'ALL' && overdue.length > 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700 font-medium">
            {overdue.length} container{overdue.length !== 1 ? 's' : ''} overdue for subculture
          </p>
        </div>
      )}

      {isLoading && <p className="text-gray-500">Loading...</p>}

      {!isLoading && isError && (
        <div className="text-center py-16">
          <p className="text-red-500 text-sm">Failed to load containers. Please try refreshing.</p>
        </div>
      )}

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
            <ContainerCard
              key={container.qrCode}
              container={container}
              selectable={selectionMode}
              selected={selectedQrs.has(container.qrCode)}
              onToggle={() => toggleSelect(container.qrCode)}
            />
          ))}
        </div>
      )}

      {/* Sticky bottom action bar */}
      {selectionMode && activeSelectedCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              {activeSelectedCount} container{activeSelectedCount !== 1 ? 's' : ''} selected
            </span>
            <Button onClick={handlePerformAction}>
              Perform Action →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
