import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDashboard } from '@/hooks/use-containers';
import type { ContainerStatus } from '@/types';

const STATUS_CARD_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  TOTAL: { label: 'Total Containers', bg: 'bg-slate-50', text: 'text-slate-900', border: 'border-slate-200' },
  HAS_CULTURE: { label: 'Active Cultures', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  HAS_MEDIA: { label: 'With Media', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  OVERDUE: { label: 'Overdue Subcultures', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
};

function getCountForStatus(statusCounts: Record<string, number>, status: ContainerStatus): number {
  return statusCounts[status] ?? 0;
}

export default function Dashboard() {
  const { data, isLoading, isError } = useDashboard();

  if (isLoading) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>
        <p className="text-red-500">Failed to load dashboard data. Please try refreshing.</p>
      </div>
    );
  }

  const statusCounts = data?.statusCounts ?? {};
  const recentLogs = data?.recentLogs ?? [];
  const totalCount = data?.totalCount ?? 0;
  const overdueCultures = data?.overdueCultures ?? 0;

  const cards = [
    { key: 'TOTAL', count: totalCount },
    { key: 'HAS_CULTURE', count: getCountForStatus(statusCounts, 'HAS_CULTURE') },
    { key: 'HAS_MEDIA', count: getCountForStatus(statusCounts, 'HAS_MEDIA') },
    { key: 'OVERDUE', count: overdueCultures },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <Link to="/operations">
          <Button>Go to Operations</Button>
        </Link>
      </div>

      {/* Status Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => {
          const config = STATUS_CARD_CONFIG[card.key];
          return (
            <Card key={card.key} className={`${config.bg} ${config.border} border`}>
              <CardContent className="p-5">
                <p className="text-sm font-medium text-gray-500">{config.label}</p>
                <p className={`text-3xl font-bold mt-1 ${config.text}`}>{card.count}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Recent Activity</CardTitle></CardHeader>
        <CardContent>
          {recentLogs.length === 0 ? (
            <p className="text-gray-400 text-sm py-4 text-center">No recent activity</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Transition</TableHead>
                  <TableHead>Container</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentLogs.slice(0, 10).map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs text-gray-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{log.action}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-gray-400">
                      {log.previousStatus && log.newStatus
                        ? `${log.previousStatus} → ${log.newStatus}`
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <Link
                        to={`/containers/${encodeURIComponent(log.containerQr)}`}
                        className="font-mono text-sm text-blue-600 hover:underline"
                      >
                        {log.containerQr}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-gray-700">{log.employee?.name ?? '—'}</TableCell>
                    <TableCell className="text-sm text-gray-500 max-w-[200px] truncate">{log.note ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
