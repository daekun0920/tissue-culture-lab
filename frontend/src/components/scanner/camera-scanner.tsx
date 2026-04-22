import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';

interface CameraScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

export function CameraScanner({ onScan, onClose }: CameraScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const onScanRef = useRef(onScan);
  const [error, setError] = useState<string | null>(null);

  // Keep callback ref in sync without triggering useEffect re-runs
  onScanRef.current = onScan;

  useEffect(() => {
    let cancelled = false;
    const scanner = new Html5Qrcode('camera-scanner-region');
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          if (cancelled) return;
          // Extract QR code from URL if needed
          let code = decodedText.trim();
          try {
            const url = new URL(code);
            const segments = url.pathname.split('/').filter(Boolean);
            code = segments[segments.length - 1] || code;
          } catch {
            // Not a URL, use as-is
          }
          onScanRef.current(code);
        },
        () => {
          // QR code not found in frame — ignore
        },
      )
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : 'Failed to start camera',
        );
      });

    return () => {
      cancelled = true;
      try {
        if (scanner.isScanning) {
          scanner.stop().catch(() => {});
        }
      } catch {
        // scanner.isScanning or stop() may throw if not initialized
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 flex flex-col items-center justify-center">
      <div className="bg-white rounded-lg p-4 max-w-sm w-full mx-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium">Camera Scanner</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        <div
          id="camera-scanner-region"
          className="w-full rounded overflow-hidden"
        />

        {error && (
          <p className="text-red-500 text-sm mt-3 text-center">{error}</p>
        )}

        <p className="text-xs text-gray-400 text-center mt-3">
          Point your camera at a QR code
        </p>
      </div>
    </div>
  );
}
