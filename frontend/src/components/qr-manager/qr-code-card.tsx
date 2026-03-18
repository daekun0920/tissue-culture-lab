import { useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { QRCodeCanvas } from 'qrcode.react';
import type { Container } from '@/types';

interface QrCodeCardProps {
  container: Container;
}

const statusColors: Record<string, string> = {
  EMPTY: 'bg-gray-100 text-gray-700',
  HAS_MEDIA: 'bg-blue-100 text-blue-700',
  HAS_CULTURE: 'bg-green-100 text-green-700',
  DISCARDED: 'bg-red-100 text-red-700',
};

export function QrCodeCard({ container }: QrCodeCardProps) {
  const navigate = useNavigate();

  const qrRef = useRef<HTMLDivElement>(null);

  const handleDownload = useCallback(() => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (!canvas) return;

    const padding = 20;
    const labelHeight = 30;
    const outCanvas = document.createElement('canvas');
    outCanvas.width = canvas.width + padding * 2;
    outCanvas.height = canvas.height + padding * 2 + labelHeight;
    const ctx = outCanvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, outCanvas.width, outCanvas.height);
    ctx.drawImage(canvas, padding, padding);

    ctx.fillStyle = '#666666';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      `QR: ${container.qrCode}`,
      outCanvas.width / 2,
      outCanvas.height - 10,
    );

    const a = document.createElement('a');
    a.download = `qr-${container.qrCode}.png`;
    a.href = outCanvas.toDataURL('image/png');
    a.click();
  }, [container.qrCode]);

  const location = container.shelf
    ? [
        container.shelf.rack?.zone?.name,
        container.shelf.rack?.name,
        container.shelf.name,
      ]
        .filter(Boolean)
        .join(' > ')
    : null;

  return (
    <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <code className="text-sm font-mono font-medium text-gray-900">
            {container.qrCode}
          </code>
          <Badge className={statusColors[container.status] ?? 'bg-gray-100 text-gray-700'}>
            {container.status.replace('_', ' ')}
          </Badge>
        </div>
        <div className="flex items-center gap-2 mt-1">
          {container.containerType && (
            <span className="text-xs text-gray-500">
              {container.containerType.name}
            </span>
          )}
          <span className="text-xs text-gray-400">
            {new Date(container.createdAt).toLocaleDateString()}
          </span>
        </div>
        {location && (
          <p className="text-xs text-indigo-600 mt-0.5">{location}</p>
        )}
      </div>
      <div ref={qrRef} style={{ position: 'absolute', left: '-9999px' }}>
        <QRCodeCanvas value={String(container.qrCode)} size={200} level="M" />
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/containers/${container.qrCode}`)}
        >
          <Eye className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={handleDownload}>
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
