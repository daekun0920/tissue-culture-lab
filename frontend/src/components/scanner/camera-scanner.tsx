import { useCallback, useRef, useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Html5Qrcode } from 'html5-qrcode';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CameraScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
  // When provided, the scanner shows a running list of scanned codes and a
  // submit button in the footer. The header "Close" becomes "Done (N)".
  scannedItems?: string[];
  onRemoveScanned?: (code: string) => void;
  onSubmit?: () => void;
  submitLabel?: string;
  canSubmit?: boolean;
  isSubmitting?: boolean;
}

// Rendered as a Radix Dialog so it stacks correctly on top of an outer
// Dialog (e.g. the Subculture action modal). Radix handles nested dismiss
// layers — Esc and outside-click close only the scanner, not the parent.
export function CameraScanner({
  onScan,
  onClose,
  scannedItems,
  onRemoveScanned,
  onSubmit,
  submitLabel = 'Submit',
  canSubmit = true,
  isSubmitting = false,
}: CameraScannerProps) {
  const showItems = Array.isArray(scannedItems);
  const count = scannedItems?.length ?? 0;
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const onScanRef = useRef(onScan);
  const [error, setError] = useState<string | null>(null);

  // Keep callback ref in sync without re-running setup
  onScanRef.current = onScan;

  // Ref callback on the region div — fires once the element is actually in
  // the DOM. This sidesteps a timing issue where Radix Dialog.Portal mounts
  // its children via useLayoutEffect, so a sibling useEffect here would run
  // before the div exists ("HTML Element with id=... not found").
  const setupRegion = useCallback((el: HTMLDivElement | null) => {
    if (el && !scannerRef.current) {
      const scanner = new Html5Qrcode(el.id);
      scannerRef.current = scanner;
      scanner
        .start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
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
            // QR not found in frame — ignore
          },
        )
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : 'Failed to start camera');
        });
    } else if (!el && scannerRef.current) {
      const scanner = scannerRef.current;
      scannerRef.current = null;
      try {
        if (scanner.isScanning) scanner.stop().catch(() => {});
      } catch {
        // scanner.isScanning/stop may throw if not initialized
      }
    }
  }, []);

  return (
    <DialogPrimitive.Root open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[60] bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed left-[50%] top-[50%] z-[60] w-full max-w-sm translate-x-[-50%] translate-y-[-50%] rounded-lg bg-white p-4 shadow-lg focus:outline-none"
        >
          <div className="flex items-center justify-between mb-3">
            <DialogPrimitive.Title className="font-medium">
              Camera Scanner
            </DialogPrimitive.Title>
            <DialogPrimitive.Close asChild>
              <Button variant="ghost" size="sm">
                {showItems ? `Done (${count})` : 'Close'}
              </Button>
            </DialogPrimitive.Close>
          </div>

          <div
            id="camera-scanner-region"
            ref={setupRegion}
            className="w-full rounded overflow-hidden"
          />

          {error && (
            <p className="text-red-500 text-sm mt-3 text-center">{error}</p>
          )}

          <p className="text-xs text-gray-400 text-center mt-3">
            Point your camera at a QR code
          </p>

          {showItems && (
            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-1.5">
                {count === 0 ? 'No QRs scanned yet' : `Scanned (${count}):`}
              </p>
              {count > 0 && (
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-2">
                  {scannedItems!.map((qr) => (
                    <span
                      key={qr}
                      className="inline-flex items-center gap-1 rounded border border-gray-200 bg-white px-2 py-1 font-mono text-xs"
                    >
                      {qr}
                      {onRemoveScanned && (
                        <button
                          type="button"
                          onClick={() => onRemoveScanned(qr)}
                          className="text-gray-400 hover:text-red-500"
                          aria-label={`Remove ${qr}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {onSubmit && (
            <Button
              type="button"
              onClick={onSubmit}
              disabled={!canSubmit || isSubmitting || count === 0}
              className="w-full mt-3"
            >
              {isSubmitting ? 'Processing...' : `${submitLabel} (${count})`}
            </Button>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
