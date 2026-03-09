import { useState, useCallback, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QrInput } from '@/components/scanner/qr-input';
import { ActionSelector } from '@/components/scanner/action-selector';
import { SelectionToolbar } from '@/components/scanner/selection-toolbar';
import { ScannerContainerCard } from '@/components/scanner/container-card';
import { SortControls } from '@/components/scanner/sort-controls';
import { ActionFormDrawer } from '@/components/scanner/action-form-drawer';
import { CameraScanner } from '@/components/scanner/camera-scanner';
import { useScannerState } from '@/hooks/use-scanner-state';
import { useBatchAction } from '@/hooks/use-containers';
import type { ActionType } from '@/types';


export default function ScannerPage() {
  const location = useLocation();
  const scanner = useScannerState();
  const batchAction = useBatchAction();
  const [showDrawer, setShowDrawer] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [results, setResults] = useState<{
    successes: string[];
    errors: { qrCode: string; reason: string }[];
  } | null>(null);
  const preloadedRef = useRef(false);

  // Auto-add containers passed via location state (from /containers or /containers/:qr)
  useEffect(() => {
    const state = location.state as { qrCodes?: string[]; action?: ActionType } | null;
    if (!state?.qrCodes || !Array.isArray(state.qrCodes) || !state.qrCodes.length || preloadedRef.current) return;
    preloadedRef.current = true;

    // Set action if provided
    if (state.action) {
      scanner.changeAction(state.action);
    }

    // Add each QR code
    const addAll = async () => {
      for (const qr of state.qrCodes!) {
        await scanner.addQrCode(qr);
      }
      toast.success(`Loaded ${state.qrCodes!.length} container${state.qrCodes!.length !== 1 ? 's' : ''}`);
    };
    addAll().catch(() => {});

    // Clear location state so refresh doesn't re-add
    window.history.replaceState({}, '');
  }, [location.state, scanner]);

  const handleAdd = useCallback(
    async (qr: string) => {
      const result = await scanner.addQrCode(qr);
      if (result === 'duplicate') {
        toast.error(`"${qr}" is already in the list`);
      }
    },
    [scanner],
  );

  const handleCameraScan = useCallback(
    (code: string) => {
      handleAdd(code);
      toast.success(`Scanned: ${code}`);
    },
    [handleAdd],
  );

  const selectedArray = Array.from(scanner.selectedQrCodes);
  const canExecute =
    scanner.selectedAction && selectedArray.length > 0;

  const handleExecute = async (
    payload: Record<string, unknown>,
    employeeId: string,
  ) => {
    if (!scanner.selectedAction) return;

    try {
      const res = await batchAction.mutateAsync({
        qrCodes: selectedArray,
        action: scanner.selectedAction,
        payload,
        employeeId,
      });
      const typed = res as { success: boolean; count: number; results?: { qrCode: string; status: string }[]; errors?: { qrCode: string; reason: string }[] };
      setResults({
        successes: typed.results?.map((r) => r.qrCode) ?? selectedArray,
        errors: typed.errors ?? [],
      });
      setShowDrawer(false);
      toast.success('Action executed successfully');
      if (!typed.errors?.length) {
        scanner.clearAll();
      }
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : 'Action failed',
      );
    }
  };

  useEffect(() => {
    setResults(null);
  }, [scanner.selectedAction, scanner.rawItems.length]);

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <h2 className="text-2xl font-bold text-gray-900">Operations</h2>

      {/* QR Input */}
      <QrInput
        onAdd={handleAdd}
        onCameraToggle={() => setShowCamera(true)}
      />

      {/* Camera Scanner Overlay */}
      {showCamera && (
        <CameraScanner
          onScan={handleCameraScan}
          onClose={() => setShowCamera(false)}
        />
      )}

      {/* Action Selector */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Action</label>
        <ActionSelector
          value={scanner.selectedAction}
          onChange={scanner.changeAction}
        />
      </div>

      {/* Selection Toolbar + Sort Controls */}
      {scanner.rawItems.length > 0 && (
        <Card>
          <CardContent className="p-3 space-y-3">
            <SelectionToolbar
              totalCount={scanner.rawItems.length}
              validCount={scanner.validCount}
              invalidCount={scanner.invalidCount}
              selectedCount={scanner.selectedQrCodes.size}
              onSelectAll={scanner.selectAll}
              onSelectValid={scanner.selectValid}
              onSelectNone={scanner.selectNone}
              onClearAll={scanner.clearAll}
            />
            <SortControls
              sortBy={scanner.sortBy}
              sortDir={scanner.sortDir}
              viewMode={scanner.viewMode}
              onSortByChange={scanner.setSortBy}
              onSortDirChange={scanner.setSortDir}
              onViewModeChange={scanner.setViewMode}
            />
          </CardContent>
        </Card>
      )}

      {/* Container Cards */}
      <div className="space-y-2">
        {scanner.scannedItems.map((item) => (
          <ScannerContainerCard
            key={item.qrCode}
            item={item}
            selected={scanner.selectedQrCodes.has(item.qrCode)}
            viewMode={scanner.viewMode}
            onToggle={() => scanner.toggleSelection(item.qrCode)}
            onRemove={() => scanner.removeQrCode(item.qrCode)}
          />
        ))}
      </div>

      {/* Execute Button */}
      {scanner.rawItems.length > 0 && (
        <div className="sticky bottom-4">
          <Button
            className="w-full h-12 text-base"
            disabled={!canExecute}
            onClick={() => setShowDrawer(true)}
          >
            Execute {scanner.selectedAction?.replace(/_/g, ' ') ?? 'Action'} on{' '}
            {selectedArray.length} Container
            {selectedArray.length !== 1 ? 's' : ''}
          </Button>
        </div>
      )}

      {/* Action Form Drawer */}
      {showDrawer && scanner.selectedAction && (
        <ActionFormDrawer
          open={showDrawer}
          onClose={() => setShowDrawer(false)}
          action={scanner.selectedAction}
          selectedCount={selectedArray.length}
          onExecute={handleExecute}
          isExecuting={batchAction.isPending}
        />
      )}

      {/* Results */}
      {results && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="font-medium text-base">Results</h3>
            {results.successes && results.successes.length > 0 && (
              <div>
                <p className="text-sm font-medium text-green-700 mb-1">
                  Success ({results.successes.length})
                </p>
                <div className="flex flex-wrap gap-1">
                  {results.successes.map((qr) => (
                    <Badge
                      key={qr}
                      className="bg-green-100 text-green-700 hover:bg-green-100 font-mono text-xs"
                    >
                      {qr}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {results.errors && results.errors.length > 0 && (
              <div>
                <p className="text-sm font-medium text-red-700 mb-1">
                  Errors ({results.errors.length})
                </p>
                <ul className="space-y-1">
                  {results.errors.map((err) => (
                    <li
                      key={err.qrCode}
                      className="text-sm text-red-600 flex gap-2"
                    >
                      <span className="font-mono">{err.qrCode}</span>
                      <span className="text-gray-400">—</span>
                      <span>{err.reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {scanner.rawItems.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <p className="text-gray-400 text-sm">
              Scan or type QR codes above to get started
            </p>
            <p className="text-gray-300 text-xs mt-1">
              Select an action, scan containers, then execute
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
