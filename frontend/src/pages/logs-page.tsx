import { useState } from 'react';
import { Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LogEntryCard } from '@/components/logs/log-entry-card';
import { useLogs } from '@/hooks/use-logs';

const ACTION_OPTIONS = [
  { value: '', label: 'All Actions' },
  { value: 'REGISTER_CONTAINER', label: 'Register Container' },
  { value: 'PREPARE_MEDIA', label: 'Prepare Media' },
  { value: 'ADD_CULTURE', label: 'Add Culture' },
  { value: 'DISCARD_CULTURE', label: 'Discard Culture' },
  { value: 'DISCARD_CONTAINER', label: 'Discard Container' },
  { value: 'SUBCULTURE', label: 'Subculture' },
  { value: 'EXIT_CULTURE', label: 'Exit Culture' },
  { value: 'WASH', label: 'Wash' },
];

export default function LogsPage() {
  const [showFilters, setShowFilters] = useState(false);
  const [action, setAction] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading } = useLogs({
    action: action || undefined,
    from: from || undefined,
    to: to || undefined,
    page,
    limit,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Activity Logs</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4 mr-1" />
          Filter
        </Button>
      </div>

      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          <select
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
          >
            {ACTION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setPage(1);
              }}
              placeholder="From"
            />
            <Input
              type="date"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setPage(1);
              }}
              placeholder="To"
            />
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="py-8 text-center text-gray-400">Loading...</div>
      ) : (
        <>
          <div className="space-y-3">
            {data?.data.map((log) => (
              <LogEntryCard key={log.id} log={log} />
            ))}
            {data?.data.length === 0 && (
              <p className="py-8 text-center text-gray-400">
                No logs found.
              </p>
            )}
          </div>

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-500">
                Page {page} of {data.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
