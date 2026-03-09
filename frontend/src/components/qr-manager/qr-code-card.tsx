import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

  const handleDownload = useCallback(() => {
    // Create a simple SVG-based QR code download
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '200');
    svg.setAttribute('height', '240');
    svg.innerHTML = `
      <rect width="200" height="240" fill="white"/>
      <text x="100" y="120" text-anchor="middle" font-size="48" font-family="monospace" fill="black">${container.qrCode}</text>
      <text x="100" y="220" text-anchor="middle" font-size="14" font-family="sans-serif" fill="#666">QR: ${container.qrCode}</text>
    `;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx?.drawImage(img, 0, 0);
      const a = document.createElement('a');
      a.download = `qr-${container.qrCode}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
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
