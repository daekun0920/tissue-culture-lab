import { Badge } from '@/components/ui/badge';
import type { ActionLog } from '@/types';
import { ArrowRight } from 'lucide-react';

const ACTION_COLORS: Record<string, string> = {
  REGISTER_CONTAINER: 'bg-gray-100 text-gray-700',
  PREPARE_MEDIA: 'bg-purple-100 text-purple-700',
  ADD_CULTURE: 'bg-green-100 text-green-700',
  DISCARD_CULTURE: 'bg-red-100 text-red-700',
  DISCARD_CONTAINER: 'bg-red-100 text-red-700',
  SUBCULTURE: 'bg-blue-100 text-blue-700',
  EXIT_CULTURE: 'bg-orange-100 text-orange-700',
  WASH: 'bg-cyan-100 text-cyan-700',
};

const ACTION_LABELS: Record<string, string> = {
  REGISTER_CONTAINER: 'Register',
  PREPARE_MEDIA: 'Media Prep',
  ADD_CULTURE: 'Add Culture',
  DISCARD_CULTURE: 'Discard Culture',
  DISCARD_CONTAINER: 'Discard Container',
  SUBCULTURE: 'Subculture',
  EXIT_CULTURE: 'Exit Culture',
  WASH: 'Wash',
};

interface LogEntryCardProps {
  log: ActionLog;
}

export function LogEntryCard({ log }: LogEntryCardProps) {
  const actionColor = ACTION_COLORS[log.action] ?? 'bg-gray-100 text-gray-700';
  const actionLabel = ACTION_LABELS[log.action] ?? log.action;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 text-sm">{actionLabel}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {new Date(log.timestamp).toLocaleString()} &middot;{' '}
            {log.employee?.name ?? log.performedBy}
          </p>
        </div>
        <Badge className={`${actionColor} shrink-0 text-xs`}>
          {actionLabel}
        </Badge>
      </div>

      <div className="mt-2 flex items-center gap-2 text-xs">
        <code className="bg-gray-100 px-2 py-0.5 rounded font-mono text-gray-700">
          {log.containerQr}
        </code>

        {log.previousStatus && log.newStatus && (
          <span className="flex items-center gap-1 text-gray-500">
            <span className="text-gray-400">{log.previousStatus}</span>
            <ArrowRight className="h-3 w-3" />
            <span className="font-medium text-gray-700">{log.newStatus}</span>
          </span>
        )}
      </div>

      {log.note && (
        <p className="mt-2 text-xs text-gray-500 italic">{log.note}</p>
      )}
    </div>
  );
}
