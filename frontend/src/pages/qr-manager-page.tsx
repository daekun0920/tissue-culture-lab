import { useState, useCallback, useRef } from 'react';
import { QrCode, Plus, Download, Printer } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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

const QR_SIZE = 200;
const CELL_PADDING = 20;
const LABEL_HEIGHT = 30;
const COLS = 4;
const CELL_W = QR_SIZE + CELL_PADDING * 2;
const CELL_H = QR_SIZE + CELL_PADDING * 2 + LABEL_HEIGHT;

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

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const bulkRef = useRef<HTMLDivElement>(null);

  const filtered = statusFilter
    ? data?.containers.filter((c) => c.status === statusFilter) ?? []
    : data?.containers ?? [];

  const selectedCodes = filtered
    .map((c) => c.qrCode)
    .filter((qr) => selected.has(qr));

  const toggleSelect = useCallback((qrCode: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(qrCode)) next.delete(qrCode);
      else next.add(qrCode);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    const allQrs = filtered.map((c) => c.qrCode);
    const allSelected = allQrs.every((qr) => selected.has(qr));
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(allQrs));
    }
  }, [filtered, selected]);

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

  /** Read hidden QRCodeCanvas elements and composite into a grid canvas */
  const buildGridCanvas = useCallback(() => {
    if (!bulkRef.current || selectedCodes.length === 0) return null;

    const canvases = selectedCodes
      .map((qr) => {
        const wrapper = bulkRef.current!.querySelector(
          `[data-qr="${qr}"]`,
        ) as HTMLElement | null;
        return {
          qr,
          canvas: wrapper?.querySelector('canvas') as HTMLCanvasElement | null,
        };
      })
      .filter(
        (item): item is { qr: string; canvas: HTMLCanvasElement } =>
          item.canvas !== null,
      );

    if (canvases.length === 0) return null;

    const rows = Math.ceil(canvases.length / COLS);
    const cols = Math.min(canvases.length, COLS);
    const out = document.createElement('canvas');
    out.width = cols * CELL_W;
    out.height = rows * CELL_H;
    const ctx = out.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, out.width, out.height);

    canvases.forEach(({ qr, canvas }, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const x = col * CELL_W + CELL_PADDING;
      const y = row * CELL_H + CELL_PADDING;

      ctx.drawImage(canvas, x, y, QR_SIZE, QR_SIZE);

      ctx.fillStyle = '#666666';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        `QR: ${qr}`,
        col * CELL_W + CELL_W / 2,
        row * CELL_H + CELL_H - 8,
      );
    });

    return out;
  }, [selectedCodes]);

  const handleBulkDownload = useCallback(() => {
    const out = buildGridCanvas();
    if (!out) {
      toast.error('Could not generate QR codes');
      return;
    }
    const a = document.createElement('a');
    a.download = `qr-codes-${selectedCodes.length}.png`;
    a.href = out.toDataURL('image/png');
    a.click();
    toast.success(`Downloaded ${selectedCodes.length} QR codes`);
  }, [buildGridCanvas, selectedCodes.length]);

  const handleBulkPrint = useCallback(() => {
    if (!bulkRef.current || selectedCodes.length === 0) return;

    const images = selectedCodes
      .map((qr) => {
        const wrapper = bulkRef.current!.querySelector(
          `[data-qr="${qr}"]`,
        ) as HTMLElement | null;
        const canvas = wrapper?.querySelector('canvas') as HTMLCanvasElement | null;
        if (!canvas) return null;
        return { qr, dataUrl: canvas.toDataURL('image/png') };
      })
      .filter(
        (item): item is { qr: string; dataUrl: string } => item !== null,
      );

    if (images.length === 0) {
      toast.error('Could not generate QR codes');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Pop-up blocked. Please allow pop-ups for this site.');
      return;
    }

    const html = `<!DOCTYPE html>
<html>
<head>
  <title>QR Codes</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: sans-serif; padding: 20px; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
    .cell { text-align: center; page-break-inside: avoid; break-inside: avoid; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; }
    .cell img { width: 160px; height: 160px; }
    .cell p { margin-top: 8px; font-size: 13px; color: #374151; font-weight: 500; }
    @media print {
      body { padding: 0; }
      .grid { gap: 8px; }
      .cell { border: 1px solid #d1d5db; }
    }
  </style>
</head>
<body>
  <div class="grid">
    ${images
      .map(
        ({ qr, dataUrl }) =>
          `<div class="cell"><img src="${dataUrl}" alt="QR ${qr}" /><p>QR: ${qr}</p></div>`,
      )
      .join('')}
  </div>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

    printWindow.document.write(html);
    printWindow.document.close();
  }, [selectedCodes]);

  if (isLoading) {
    return <div className="py-8 text-center text-gray-400">Loading...</div>;
  }

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((c) => selected.has(c.qrCode));

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
            <DialogDescription className="text-sm text-gray-500">
              Enter QR codes to register as new containers in the system.
            </DialogDescription>
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
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900">All QR Codes</h2>
            {filtered.length > 0 && (
              <button
                onClick={toggleAll}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                {allFilteredSelected ? 'Deselect all' : 'Select all'}
              </button>
            )}
          </div>
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

        {/* Bulk action bar */}
        {selectedCodes.length > 0 && (
          <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3">
            <span className="text-sm font-medium text-indigo-700">
              {selectedCodes.length} selected
            </span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleBulkDownload}>
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
              <Button size="sm" variant="outline" onClick={handleBulkPrint}>
                <Printer className="h-4 w-4 mr-1" />
                Print
              </Button>
            </div>
          </div>
        )}

        {/* Hidden QR canvases for bulk operations */}
        <div
          ref={bulkRef}
          style={{ position: 'absolute', left: '-9999px' }}
          aria-hidden="true"
        >
          {selectedCodes.map((qr) => (
            <div key={qr} data-qr={qr}>
              <QRCodeCanvas value={String(qr)} size={QR_SIZE} level="M" />
            </div>
          ))}
        </div>

        {filtered.map((container) => (
          <QrCodeCard
            key={container.qrCode}
            container={container}
            selectable
            selected={selected.has(container.qrCode)}
            onToggle={toggleSelect}
          />
        ))}

        {filtered.length === 0 && (
          <p className="py-8 text-center text-gray-400">No QR codes found.</p>
        )}
      </div>
    </div>
  );
}
