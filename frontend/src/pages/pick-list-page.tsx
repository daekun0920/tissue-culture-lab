import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { PickListItem } from '@/components/pick-list/pick-list-item';
import { PickListSection } from '@/components/pick-list/pick-list-section';
import { usePickList, usePickListSummary } from '@/hooks/use-pick-list';

export default function PickListPage() {
  const navigate = useNavigate();
  const { data, isLoading } = usePickList();
  const { data: summary } = usePickListSummary();

  const total = summary?.total ?? 0;
  const completed = summary?.completedCount ?? 0;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  if (isLoading) {
    return <div className="py-8 text-center text-gray-400">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Pick List</h1>
        <span className="text-sm text-gray-500">
          {completed}/{total} completed
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-indigo-600 h-2 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {/* Expired */}
        {(data?.expired?.length ?? 0) > 0 && (
          <PickListSection
            title="Expired"
            count={data!.expired.length}
            borderColor="border-red-500"
          >
            {data!.expired.map((c) => (
              <PickListItem key={c.qrCode} container={c} variant="expired" />
            ))}
          </PickListSection>
        )}

        {/* Due Soon */}
        <PickListSection
          title="Due Soon"
          count={data?.dueSoon?.length ?? 0}
          borderColor="border-blue-500"
        >
          {data?.dueSoon?.length ? (
            data.dueSoon.map((c) => (
              <PickListItem key={c.qrCode} container={c} variant="due" />
            ))
          ) : (
            <p className="text-sm text-gray-400 py-2">No items due soon</p>
          )}
        </PickListSection>

        {/* Completed */}
        <PickListSection
          title="Completed Today"
          count={data?.completed?.length ?? 0}
          borderColor="border-green-500"
          bgColor="bg-green-50/50"
          defaultOpen={false}
        >
          {data?.completed?.length ? (
            data.completed.map((log) => (
              <div
                key={log.id}
                className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono text-gray-900">
                      {log.containerQr}
                    </code>
                    <Badge className="bg-green-100 text-green-700 text-xs">
                      {log.action}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {log.employee?.name} &middot;{' '}
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-400 py-2">
              No completed items today
            </p>
          )}
        </PickListSection>
      </div>
    </div>
  );
}
