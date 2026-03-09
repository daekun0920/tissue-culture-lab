import { useState } from 'react';
import { QrCode } from 'lucide-react';
import { QrStats } from '@/components/qr-manager/qr-stats';
import { QrCodeCard } from '@/components/qr-manager/qr-code-card';
import { useQrSummary } from '@/hooks/use-qr-manager';

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

  const filtered = statusFilter
    ? data?.containers.filter((c) => c.status === statusFilter) ?? []
    : data?.containers ?? [];

  if (isLoading) {
    return <div className="py-8 text-center text-gray-400">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <h1 className="text-2xl font-bold text-gray-900">QR Manager</h1>

      {/* QR Preview */}
      <div className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-2xl p-8 bg-gray-50">
        <div className="text-center">
          <QrCode className="h-16 w-16 text-gray-300 mx-auto" />
          <p className="text-sm text-gray-400 mt-2">QR Code Preview</p>
        </div>
      </div>

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
