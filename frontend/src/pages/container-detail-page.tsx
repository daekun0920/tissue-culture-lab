import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/containers/status-badge';
import { ContainerCard } from '@/components/containers/container-card';
import { useContainerDetail } from '@/hooks/use-containers';
import {
  ContainerActionDialog,
  getAvailableActions,
  type ActionConfig,
} from '@/components/containers/container-action-dialog';
import { formatEnum } from '@/lib/format';

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString();
}

export default function ContainerDetailPage() {
  const { qr } = useParams<{ qr: string }>();
  const navigate = useNavigate();
  const { data: container, isLoading, isError } = useContainerDetail(qr ?? '');
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<ActionConfig | undefined>();

  if (isLoading) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Container: <span className="font-mono">{qr}</span>
        </h2>
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (isError || !container) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Container Not Found</h2>
        <p className="text-gray-500">
          No container found with QR code <span className="font-mono font-medium">{qr}</span>.
        </p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/scan')}>
          Back to Scan
        </Button>
      </div>
    );
  }

  const logs = container.logs ?? [];
  const children = container.children ?? [];
  const isOverdue =
    container.status === 'HAS_CULTURE' &&
    container.dueSubcultureDate &&
    new Date(container.dueSubcultureDate) < new Date();

  return (
    <div className="max-w-4xl">
      {/* Top Section */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="font-mono text-4xl font-bold text-gray-900 mb-2">{container.qrCode}</p>
          <div className="flex items-center gap-2">
            <StatusBadge status={container.status} />
            {isOverdue && (
              <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Overdue</Badge>
            )}
          </div>
        </div>
        <Button variant="outline" onClick={() => navigate('/scan')}>
          Back to Scan
        </Button>
      </div>

      {/* Info Card */}
      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">Container Info</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div>
              <dt className="text-gray-500">Status</dt>
              <dd className="font-medium text-gray-900">{formatEnum(container.status)}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Last Updated</dt>
              <dd className="font-medium text-gray-900">{formatTimestamp(container.updatedAt)}</dd>
            </div>
            {container.containerType && (
              <div>
                <dt className="text-gray-500">Container Type</dt>
                <dd className="font-medium text-gray-900">
                  {container.containerType.name}
                  {container.containerType.size ? ` (${container.containerType.size})` : ''}
                </dd>
              </div>
            )}
            {container.media && (
              <>
                <div>
                  <dt className="text-gray-500">Media Recipe</dt>
                  <dd className="font-medium text-gray-900">{container.media.recipe?.name ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Batch Prepared</dt>
                  <dd className="font-medium text-gray-900">{new Date(container.media.datePrep).toLocaleDateString()}</dd>
                </div>
              </>
            )}
            {container.culture && (
              <div>
                <dt className="text-gray-500">Culture</dt>
                <dd className="font-medium text-gray-900">{container.culture.name}</dd>
              </div>
            )}
            {container.cultureDate && (
              <div>
                <dt className="text-gray-500">Culture Date</dt>
                <dd className="font-medium text-gray-900">{new Date(container.cultureDate).toLocaleDateString()}</dd>
              </div>
            )}
            {container.dueSubcultureDate && (
              <div>
                <dt className="text-gray-500">Due Subculture</dt>
                <dd className={`font-medium ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                  {new Date(container.dueSubcultureDate).toLocaleDateString()}
                  {isOverdue && ' (OVERDUE)'}
                </dd>
              </div>
            )}
            {container.parent && (
              <div>
                <dt className="text-gray-500">Parent Container</dt>
                <dd>
                  <Link to={`/containers/${encodeURIComponent(container.parent.qrCode)}`} className="font-mono text-sm text-blue-600 hover:underline">
                    {container.parent.qrCode}
                  </Link>
                </dd>
              </div>
            )}
            {container.notes && (
              <div className="col-span-2">
                <dt className="text-gray-500">Notes</dt>
                <dd className="font-medium text-gray-900">{container.notes}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {getAvailableActions(container.status).length > 0 && (
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-base">Actions</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {getAvailableActions(container.status).map((ac) => (
                <Button
                  key={ac.action}
                  variant={ac.action.includes('DISCARD') ? 'destructive' : 'default'}
                  size="sm"
                  onClick={() => {
                    setSelectedAction(ac);
                    setActionDialogOpen(true);
                  }}
                >
                  {ac.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Dialog */}
      <ContainerActionDialog
        container={container}
        open={actionDialogOpen}
        onOpenChange={setActionDialogOpen}
        selectedAction={selectedAction}
      />

      {/* Sub-cultures */}
      {children.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Sub-cultures ({children.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {children.map((child) => (
                <ContainerCard key={child.qrCode} container={child} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Log Timeline */}
      <Card>
        <CardHeader><CardTitle className="text-base">Action Log</CardTitle></CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-gray-400 text-sm py-4 text-center">No actions recorded yet</p>
          ) : (
            <div className="relative">
              <div className="absolute left-3 top-2 bottom-2 w-px bg-gray-200" />
              <ul className="space-y-4">
                {logs.map((log) => (
                  <li key={log.id} className="relative pl-9">
                    <div className="absolute left-1.5 top-1.5 h-3 w-3 rounded-full border-2 border-gray-300 bg-white" />
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{formatEnum(log.action)}</Badge>
                        {log.previousStatus && log.newStatus && (
                          <span className="text-xs text-gray-400">
                            {formatEnum(log.previousStatus)} → {formatEnum(log.newStatus)}
                          </span>
                        )}
                        <span className="text-xs text-gray-400">{formatTimestamp(log.timestamp)}</span>
                      </div>
                      <p className="text-sm text-gray-700">
                        {log.employee?.name ?? 'Unknown'}
                        {log.note ? (
                          <span className="text-gray-400 ml-2">&mdash; {log.note}</span>
                        ) : null}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
