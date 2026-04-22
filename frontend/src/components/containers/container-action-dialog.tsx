import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Camera, X } from 'lucide-react';
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
import { CameraScanner } from '@/components/scanner/camera-scanner';
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
  const [targetQrs, setTargetQrs] = useState<string[]>([]);
  const [manualInput, setManualInput] = useState('');
  const [inputMode, setInputMode] = useState<'scan' | 'manual'>('scan');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [note, setNote] = useState('');

  const parseManual = (raw: string): string[] =>
    raw
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean);

  const effectiveTargets = inputMode === 'scan' ? targetQrs : parseManual(manualInput);

  const lastScanRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });
  const addScannedTarget = (code: string) => {
    const clean = code.trim();
    if (!clean) return;
    const now = Date.now();
    // Scanner fires ~10x/sec while a code is in frame — dedupe same code within 1.5s.
    if (lastScanRef.current.code === clean && now - lastScanRef.current.time < 1500) {
      return;
    }
    lastScanRef.current = { code: clean, time: now };
    if (clean === container.qrCode) {
      toast.info('Source container cannot be a target');
      return;
    }
    setTargetQrs((prev) => (prev.includes(clean) ? prev : [...prev, clean]));
  };

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
    if (needsTargetQrs && effectiveTargets.length === 0) return false;
    return true;
  };

  const handleSubmit = () => {
    const payload: Record<string, unknown> = {};
    if (needsMediaBatch) payload.mediaBatchId = mediaBatchId;
    if (needsCultureType) payload.cultureTypeId = cultureTypeId;
    if (needsReason) payload.reason = reason;
    if (needsTargetQrs) {
      payload.targetQrCodes = effectiveTargets;
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
    setTargetQrs([]);
    setManualInput('');
    setInputMode('scan');
    setCameraOpen(false);
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

          {/* Target QR codes for subculture — scan by default, manual as fallback */}
          {needsTargetQrs && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Target Container QR Codes *</Label>
                <button
                  type="button"
                  onClick={() => setInputMode((m) => (m === 'scan' ? 'manual' : 'scan'))}
                  className="text-xs text-indigo-600 hover:underline"
                >
                  {inputMode === 'scan' ? 'Type manually' : 'Scan instead'}
                </button>
              </div>

              {inputMode === 'scan' ? (
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCameraOpen(true)}
                    className="w-full h-11"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Open Camera Scanner
                  </Button>

                  {targetQrs.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 rounded-lg border border-gray-200 bg-gray-50 p-2">
                      {targetQrs.map((qr) => (
                        <span
                          key={qr}
                          className="inline-flex items-center gap-1 rounded border border-gray-200 bg-white px-2 py-1 font-mono text-xs"
                        >
                          {qr}
                          <button
                            type="button"
                            onClick={() =>
                              setTargetQrs((prev) => prev.filter((x) => x !== qr))
                            }
                            className="text-gray-400 hover:text-red-500"
                            aria-label={`Remove ${qr}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <p className="text-xs text-gray-400">
                    {targetQrs.length > 0
                      ? `${targetQrs.length} container${targetQrs.length === 1 ? '' : 's'} scanned. Keep scanning to add more.`
                      : 'Scan containers with media to receive the culture'}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <Input
                    placeholder="e.g. 1004, 1005, 1006"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                  />
                  <p className="text-xs text-gray-400">
                    Comma-separated QR codes of containers with media to receive the culture
                  </p>
                </div>
              )}
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

      {cameraOpen && (
        <CameraScanner
          onScan={addScannedTarget}
          onClose={() => setCameraOpen(false)}
        />
      )}
    </Dialog>
  );
}

export { getAvailableActions, type ActionConfig };
