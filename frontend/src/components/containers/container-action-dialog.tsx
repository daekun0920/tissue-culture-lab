import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBatchAction } from '@/hooks/use-containers';
import { useEmployees } from '@/hooks/use-employees';
import { useMediaBatches } from '@/hooks/use-media-batches';
import { useCultureTypes } from '@/hooks/use-culture-types';
import { queryKeys } from '@/lib/query-keys';
import { toast } from 'sonner';
import type { Container } from '@/types';

type ActionConfig = {
  action: string;
  label: string;
  description: string;
};

const DISCARD_REASONS = [
  { value: 'contamination', label: 'Contamination' },
  { value: 'senescence', label: 'Senescence' },
  { value: 'experiment_end', label: 'Experiment End' },
  { value: 'other', label: 'Other' },
];

function getAvailableActions(status: string): ActionConfig[] {
  switch (status) {
    case 'EMPTY':
      return [
        { action: 'PREPARE_MEDIA', label: 'Assign Media', description: 'Add prepared media to this container' },
        { action: 'DISCARD_CONTAINER', label: 'Discard Container', description: 'Permanently discard this container' },
      ];
    case 'HAS_MEDIA':
      return [
        { action: 'ADD_CULTURE', label: 'Add Culture', description: 'Inoculate a culture into this container' },
        { action: 'DISCARD_CONTAINER', label: 'Discard Container', description: 'Permanently discard this container' },
      ];
    case 'HAS_CULTURE':
      return [
        { action: 'SUBCULTURE', label: 'Subculture', description: 'Transfer culture to new containers' },
        { action: 'DISCARD_CULTURE', label: 'Discard Culture', description: 'Remove the culture (keep container)' },
        { action: 'DISCARD_CONTAINER', label: 'Discard Container', description: 'Permanently discard this container' },
      ];
    case 'DISCARDED':
      return [
        { action: 'WASH', label: 'Wash & Reuse', description: 'Clean and reuse this container' },
      ];
    default:
      return [];
  }
}

interface ContainerActionDialogProps {
  container: Container;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedAction?: ActionConfig;
}

export function ContainerActionDialog({
  container,
  open,
  onOpenChange,
  selectedAction,
}: ContainerActionDialogProps) {
  const qc = useQueryClient();
  const batchAction = useBatchAction();
  const { data: employees } = useEmployees();
  const { data: mediaBatches } = useMediaBatches();
  const { data: cultureTypes } = useCultureTypes();

  const [employeeId, setEmployeeId] = useState('');
  const [mediaBatchId, setMediaBatchId] = useState('');
  const [cultureTypeId, setCultureTypeId] = useState('');
  const [reason, setReason] = useState('');
  const [targetQrCodes, setTargetQrCodes] = useState('');
  const [note, setNote] = useState('');

  if (!selectedAction) return null;

  const needsMediaBatch = selectedAction.action === 'PREPARE_MEDIA';
  const needsCultureType = selectedAction.action === 'ADD_CULTURE';
  const needsReason = selectedAction.action === 'DISCARD_CULTURE' || selectedAction.action === 'DISCARD_CONTAINER';
  const needsTargetQrs = selectedAction.action === 'SUBCULTURE';

  const canSubmit = () => {
    if (!employeeId) return false;
    if (needsMediaBatch && !mediaBatchId) return false;
    if (needsCultureType && !cultureTypeId) return false;
    if (needsReason && !reason) return false;
    if (needsTargetQrs && !targetQrCodes.trim()) return false;
    return true;
  };

  const handleSubmit = () => {
    const payload: Record<string, unknown> = {};
    if (needsMediaBatch) payload.mediaBatchId = mediaBatchId;
    if (needsCultureType) payload.cultureTypeId = cultureTypeId;
    if (needsReason) payload.reason = reason;
    if (needsTargetQrs) {
      payload.targetQrCodes = targetQrCodes
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    if (note.trim()) payload.note = note.trim();

    batchAction.mutate(
      {
        qrCodes: [container.qrCode],
        action: selectedAction.action,
        payload,
        employeeId,
      },
      {
        onSuccess: () => {
          toast.success(`${selectedAction.label} completed successfully`);
          qc.invalidateQueries({ queryKey: queryKeys.containers.detail(container.qrCode) });
          qc.invalidateQueries({ queryKey: queryKeys.qrManager.summary });
          qc.invalidateQueries({ queryKey: queryKeys.pickList.summary });
          onOpenChange(false);
          resetForm();
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : 'Action failed');
        },
      },
    );
  };

  const resetForm = () => {
    setEmployeeId('');
    setMediaBatchId('');
    setCultureTypeId('');
    setReason('');
    setTargetQrCodes('');
    setNote('');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetForm(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{selectedAction.label}</DialogTitle>
          <p className="text-sm text-gray-500">{selectedAction.description}</p>
          <p className="text-sm text-gray-500 mt-1">
            Container: <span className="font-mono font-medium">{container.qrCode}</span>
          </p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Employee selector - always required */}
          <div className="space-y-1.5">
            <Label>Employee *</Label>
            <select
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
            >
              <option value="">Select employee...</option>
              {employees
                ?.filter((e) => e.isActive)
                .map((e) => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
            </select>
          </div>

          {/* Media batch selector */}
          {needsMediaBatch && (
            <div className="space-y-1.5">
              <Label>Media Batch *</Label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={mediaBatchId}
                onChange={(e) => setMediaBatchId(e.target.value)}
              >
                <option value="">Select media batch...</option>
                {mediaBatches?.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.recipe?.name ?? 'Unknown'} — {b.batchNumber ?? 'No #'} ({new Date(b.datePrep).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Culture type selector */}
          {needsCultureType && (
            <div className="space-y-1.5">
              <Label>Culture Type *</Label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={cultureTypeId}
                onChange={(e) => setCultureTypeId(e.target.value)}
              >
                <option value="">Select culture type...</option>
                {cultureTypes?.map((ct) => (
                  <option key={ct.id} value={ct.id}>
                    {ct.name} {ct.species ? `(${ct.species})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Discard reason */}
          {needsReason && (
            <div className="space-y-1.5">
              <Label>Reason *</Label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                <option value="">Select reason...</option>
                {DISCARD_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Target QR codes for subculture */}
          {needsTargetQrs && (
            <div className="space-y-1.5">
              <Label>Target Container QR Codes *</Label>
              <Input
                placeholder="e.g. 1004, 1005, 1006"
                value={targetQrCodes}
                onChange={(e) => setTargetQrCodes(e.target.value)}
              />
              <p className="text-xs text-gray-400">
                Comma-separated QR codes of containers with media to receive the culture
              </p>
            </div>
          )}

          {/* Note */}
          <div className="space-y-1.5">
            <Label>Note (optional)</Label>
            <Input
              placeholder="Add a note..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { onOpenChange(false); resetForm(); }}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit() || batchAction.isPending}
          >
            {batchAction.isPending ? 'Processing...' : selectedAction.label}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { getAvailableActions, type ActionConfig };
