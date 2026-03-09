import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useContainerTypes } from '@/hooks/use-container-types';
import { useMediaBatches } from '@/hooks/use-media-batches';
import { useCultureTypes } from '@/hooks/use-culture-types';
import { useEmployees } from '@/hooks/use-employees';
import type { ActionType } from '@/types';

interface ActionFormDrawerProps {
  open: boolean;
  onClose: () => void;
  action: ActionType;
  selectedCount: number;
  onExecute: (payload: Record<string, unknown>, employeeId: string) => void;
  isExecuting: boolean;
}

export function ActionFormDrawer({
  open,
  onClose,
  action,
  selectedCount,
  onExecute,
  isExecuting,
}: ActionFormDrawerProps) {
  const { data: containerTypes } = useContainerTypes();
  const { data: mediaBatches } = useMediaBatches();
  const { data: cultureTypes } = useCultureTypes();
  const { data: employees } = useEmployees();

  const [containerTypeId, setContainerTypeId] = useState('');
  const [mediaBatchId, setMediaBatchId] = useState('');
  const [cultureTypeId, setCultureTypeId] = useState('');
  const [subcultureInterval, setSubcultureInterval] = useState('');
  const [reason, setReason] = useState('');
  const [exitType, setExitType] = useState('');
  const [targetQrCodesStr, setTargetQrCodesStr] = useState('');
  const [note, setNote] = useState('');
  const [employeeId, setEmployeeId] = useState('');

  const handleSubmit = () => {
    if (!employeeId) {
      toast.error('Employee is required');
      return;
    }

    const payload: Record<string, unknown> = {};
    if (note.trim()) payload.note = note.trim();

    switch (action) {
      case 'REGISTER_CONTAINER':
        if (containerTypeId) payload.containerTypeId = containerTypeId;
        break;
      case 'PREPARE_MEDIA':
        if (!mediaBatchId) {
          toast.error('Media batch is required');
          return;
        }
        payload.mediaBatchId = mediaBatchId;
        break;
      case 'ADD_CULTURE':
        if (!cultureTypeId) {
          toast.error('Culture type is required');
          return;
        }
        payload.cultureTypeId = cultureTypeId;
        if (subcultureInterval) {
          const parsed = parseInt(subcultureInterval, 10);
          if (!isNaN(parsed) && parsed > 0) {
            payload.subcultureInterval = parsed;
          }
        }
        break;
      case 'DISCARD_CULTURE':
      case 'DISCARD_CONTAINER':
        if (!reason) {
          toast.error('Reason is required');
          return;
        }
        payload.reason = reason;
        break;
      case 'SUBCULTURE': {
        const targets = targetQrCodesStr
          .split(/[,\n]/)
          .map((s) => s.trim())
          .filter(Boolean);
        if (!targets.length) {
          toast.error('At least one target QR code is required');
          return;
        }
        payload.targetQrCodes = targets;
        break;
      }
      case 'EXIT_CULTURE':
        if (exitType) payload.exitType = exitType;
        break;
    }

    onExecute(payload, employeeId);
  };

  const activeEmployees = (employees ?? []).filter((e) => e.isActive);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {action.replace(/_/g, ' ')} — {selectedCount} container
            {selectedCount !== 1 ? 's' : ''}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Action-specific fields */}
          {action === 'REGISTER_CONTAINER' && (
            <div className="space-y-2">
              <Label>Container Type</Label>
              <Select
                value={containerTypeId}
                onValueChange={setContainerTypeId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {(containerTypes ?? []).map((ct) => (
                    <SelectItem key={ct.id} value={ct.id}>
                      {ct.name}
                      {ct.size ? ` (${ct.size})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {action === 'PREPARE_MEDIA' && (
            <div className="space-y-2">
              <Label>Media Batch</Label>
              <Select value={mediaBatchId} onValueChange={setMediaBatchId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a media batch" />
                </SelectTrigger>
                <SelectContent>
                  {(mediaBatches ?? []).map((batch) => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.recipe?.name ?? batch.recipeId}
                      {batch.batchNumber ? ` (${batch.batchNumber})` : ''} —{' '}
                      {new Date(batch.datePrep).toLocaleDateString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {action === 'ADD_CULTURE' && (
            <>
              <div className="space-y-2">
                <Label>Culture Type</Label>
                <Select
                  value={cultureTypeId}
                  onValueChange={setCultureTypeId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select culture type" />
                  </SelectTrigger>
                  <SelectContent>
                    {(cultureTypes ?? []).map((ct) => (
                      <SelectItem key={ct.id} value={ct.id}>
                        {ct.name}
                        {ct.species ? ` (${ct.species})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Subculture Interval (days)</Label>
                <Input
                  type="number"
                  placeholder="28"
                  value={subcultureInterval}
                  onChange={(e) => setSubcultureInterval(e.target.value)}
                />
              </div>
            </>
          )}

          {(action === 'DISCARD_CULTURE' ||
            action === 'DISCARD_CONTAINER') && (
            <div className="space-y-2">
              <Label>Reason</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contamination">Contamination</SelectItem>
                  <SelectItem value="senescence">Senescence</SelectItem>
                  <SelectItem value="experiment_end">
                    Experiment End
                  </SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {action === 'SUBCULTURE' && (
            <div className="space-y-2">
              <Label>Target QR Codes (new containers)</Label>
              <Textarea
                placeholder="Enter QR codes, one per line or comma-separated"
                value={targetQrCodesStr}
                onChange={(e) => setTargetQrCodesStr(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-gray-400">
                These containers must have HAS_MEDIA status to receive the
                culture
              </p>
            </div>
          )}

          {action === 'EXIT_CULTURE' && (
            <div className="space-y-2">
              <Label>Exit Type</Label>
              <Select value={exitType} onValueChange={setExitType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select exit type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sold">Sold</SelectItem>
                  <SelectItem value="removed_for_growth">
                    Removed for Growth
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Note (all actions) */}
          <div className="space-y-2">
            <Label>Note (optional)</Label>
            <Textarea
              placeholder="Add a note..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
            />
          </div>

          {/* Employee (required for all) */}
          <div className="space-y-2">
            <Label>
              Employee <span className="text-red-500">*</span>
            </Label>
            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger>
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {activeEmployees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!employeeId || isExecuting}
          >
            {isExecuting
              ? 'Executing...'
              : `Execute on ${selectedCount} container${selectedCount !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
