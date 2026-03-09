import { useState } from 'react';
import { QrCode, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { QrStats } from '@/components/qr-manager/qr-stats';
import { QrCodeCard } from '@/components/qr-manager/qr-code-card';
import { useQrSummary } from '@/hooks/use-qr-manager';
import { useRegisterContainers } from '@/hooks/use-containers';
import { useContainerTypes } from '@/hooks/use-container-types';
import { queryKeys } from '@/lib/query-keys';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const STATUS_FILTERS = [
  { value: '', label: 'All Statuses' },
  { value: 'EMPTY', label: 'Empty' },
  { value: 'HAS_MEDIA', label: 'Has Media' },
  { value: 'HAS_CULTURE', label: 'Has Culture' },
  { value: 'DISCARDED', label: 'Discarded' },
];

export default function QrManagerPage() {
  const { data, isLoading } = useQrSummary();
  const [statusFilter, setStatusFilter] = useState('');
  const [generateOpen, setGenerateOpen] = useState(false);
  const [qrCodesInput, setQrCodesInput] = useState('');
  const [containerTypeId, setContainerTypeId] = useState('');
  const [notes, setNotes] = useState('');
  const { data: containerTypes } = useContainerTypes();
  const registerContainers = useRegisterContainers();
  const qc = useQueryClient();

  const handleGenerate = () => {
    const qrCodes = qrCodesInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (qrCodes.length === 0) {
      toast.error('Please enter at least one QR code');
      return;
    }
    registerContainers.mutate(
      {
        qrCodes,
        containerTypeId: containerTypeId || undefined,
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success(`${qrCodes.length} container(s) registered successfully`);
          qc.invalidateQueries({ queryKey: queryKeys.qrManager.summary });
          setGenerateOpen(false);
          setQrCodesInput('');
          setContainerTypeId('');
          setNotes('');
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : 'Registration failed');
        },
      },
    );
  };

  const filtered = statusFilter
    ? data?.containers.filter((c) => c.status === statusFilter) ?? []
    : data?.containers ?? [];

  if (isLoading) {
    return <div className="py-8 text-center text-gray-400">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">QR Manager</h1>
        <Button onClick={() => setGenerateOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Register QR
        </Button>
      </div>

      {/* QR Preview */}
      <div
        className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-2xl p-8 bg-gray-50 cursor-pointer hover:border-indigo-400 transition-colors"
        onClick={() => setGenerateOpen(true)}
      >
        <div className="text-center">
          <QrCode className="h-16 w-16 text-gray-300 mx-auto" />
          <p className="text-sm text-gray-400 mt-2">Click to register new QR codes</p>
        </div>
      </div>

      {/* Generate / Register Dialog */}
      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Register New Containers</DialogTitle>
            <p className="text-sm text-gray-500">
              Enter QR codes to register as new containers in the system.
            </p>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>QR Codes *</Label>
              <Input
                placeholder="e.g. 2001, 2002, 2003"
                value={qrCodesInput}
                onChange={(e) => setQrCodesInput(e.target.value)}
              />
              <p className="text-xs text-gray-400">Comma-separated QR codes</p>
            </div>
            <div className="space-y-1.5">
              <Label>Container Type (optional)</Label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={containerTypeId}
                onChange={(e) => setContainerTypeId(e.target.value)}
              >
                <option value="">No type specified</option>
                {containerTypes?.map((ct) => (
                  <option key={ct.id} value={ct.id}>
                    {ct.name} {ct.size ? `(${ct.size})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Input
                placeholder="Add a note..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenerateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={!qrCodesInput.trim() || registerContainers.isPending}
            >
              {registerContainers.isPending ? 'Registering...' : 'Register'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stats */}
      <QrStats
        active={data?.active ?? 0}
        generated={data?.generated ?? 0}
        archived={data?.archived ?? 0}
      />

      {/* QR Code List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">All QR Codes</h2>
          <select
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUS_FILTERS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {filtered.map((container) => (
          <QrCodeCard key={container.qrCode} container={container} />
        ))}

        {filtered.length === 0 && (
          <p className="py-8 text-center text-gray-400">No QR codes found.</p>
        )}
      </div>
    </div>
  );
}
