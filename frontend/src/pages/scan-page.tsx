import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScanLine } from 'lucide-react';
import { QrInput } from '@/components/scanner/qr-input';
import { CameraScanner } from '@/components/scanner/camera-scanner';

export default function ScanPage() {
  const navigate = useNavigate();
  const [showCamera, setShowCamera] = useState(false);

  const handleScan = (qr: string) => {
    setShowCamera(false);
    navigate(`/containers/${encodeURIComponent(qr)}`);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Hero banner */}
      <div className="bg-indigo-600 rounded-2xl p-8 text-center text-white">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-4">
          <ScanLine className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold">Scan QR Code</h1>
        <p className="text-indigo-100 mt-2 text-sm">
          Scan a container or culture QR code to view details and manage items
        </p>
      </div>

      {/* Manual input */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <QrInput
          onAdd={handleScan}
          onCameraToggle={() => setShowCamera(true)}
        />
      </div>

      {showCamera && (
        <CameraScanner
          onScan={handleScan}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
}
