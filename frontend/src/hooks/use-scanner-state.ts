import { useState, useCallback } from 'react';
import { containerApi } from '@/lib/api';
import type { ActionType, Container, ScannedContainer } from '@/types';

const ACTION_VALID_STATUSES: Record<string, string[]> = {
  REGISTER_CONTAINER: [],
  PREPARE_MEDIA: ['EMPTY'],
  ADD_CULTURE: ['HAS_MEDIA'],
  DISCARD_CULTURE: ['HAS_CULTURE', 'HAS_MEDIA'],
  DISCARD_CONTAINER: ['EMPTY', 'HAS_MEDIA', 'HAS_CULTURE'],
  SUBCULTURE: ['HAS_CULTURE'],
  EXIT_CULTURE: ['HAS_CULTURE'],
  WASH: ['DISCARDED'],
};

function validateContainer(
  container: Container | null,
  action: ActionType | null,
): { isValid: boolean; invalidReason?: string } {
  if (!action) return { isValid: true };

  if (action === 'REGISTER_CONTAINER') {
    if (container !== null) {
      return { isValid: false, invalidReason: 'Already registered' };
    }
    return { isValid: true };
  }

  if (container === null) {
    return { isValid: false, invalidReason: 'Not registered' };
  }

  const validStatuses = ACTION_VALID_STATUSES[action] ?? [];
  if (!validStatuses.includes(container.status)) {
    return {
      isValid: false,
      invalidReason: `Must be ${validStatuses.join(' or ')} for ${action}`,
    };
  }

  return { isValid: true };
}

export type SortBy = 'qr' | 'status' | 'culture' | 'date';
export type SortDir = 'asc' | 'desc';
export type ViewMode = 'essential' | 'full';

export function useScannerState() {
  const [scannedItems, setScannedItems] = useState<ScannedContainer[]>([]);
  const [selectedAction, setSelectedAction] = useState<ActionType | null>(null);
  const [selectedQrCodes, setSelectedQrCodes] = useState<Set<string>>(
    new Set(),
  );
  const [sortBy, setSortBy] = useState<SortBy>('qr');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [viewMode, setViewMode] = useState<ViewMode>('essential');

  const revalidateAll = useCallback(
    (items: ScannedContainer[], action: ActionType | null) => {
      return items.map((item) => {
        const { isValid, invalidReason } = validateContainer(
          item.container,
          action,
        );
        return { ...item, isValid, invalidReason };
      });
    },
    [],
  );

  const addQrCode = useCallback(
    async (qr: string) => {
      const trimmed = qr.trim();
      if (!trimmed) return;

      // Check for duplicate
      if (scannedItems.some((item) => item.qrCode === trimmed)) {
        return 'duplicate';
      }

      // Fetch container from API
      let container: Container | null = null;
      try {
        container = await containerApi.getByQr(trimmed);
      } catch {
        // Container not found = null
        container = null;
      }

      const { isValid, invalidReason } = validateContainer(
        container,
        selectedAction,
      );
      const newItem: ScannedContainer = {
        qrCode: trimmed,
        container,
        isValid,
        invalidReason,
      };

      setScannedItems((prev) => [...prev, newItem]);
      // Auto-select if valid
      if (isValid) {
        setSelectedQrCodes((prev) => new Set([...prev, trimmed]));
      }

      return 'added';
    },
    [scannedItems, selectedAction],
  );

  const removeQrCode = useCallback((qr: string) => {
    setScannedItems((prev) => prev.filter((item) => item.qrCode !== qr));
    setSelectedQrCodes((prev) => {
      const next = new Set(prev);
      next.delete(qr);
      return next;
    });
  }, []);

  const changeAction = useCallback(
    (action: ActionType | null) => {
      setSelectedAction(action);
      setScannedItems((prev) => {
        const revalidated = revalidateAll(prev, action);
        // Update selection: only keep valid items selected
        const validQrs = new Set(
          revalidated.filter((i) => i.isValid).map((i) => i.qrCode),
        );
        setSelectedQrCodes(validQrs);
        return revalidated;
      });
    },
    [revalidateAll],
  );

  const toggleSelection = useCallback((qr: string) => {
    setSelectedQrCodes((prev) => {
      const next = new Set(prev);
      if (next.has(qr)) next.delete(qr);
      else next.add(qr);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedQrCodes(new Set(scannedItems.map((i) => i.qrCode)));
  }, [scannedItems]);

  const selectValid = useCallback(() => {
    setSelectedQrCodes(
      new Set(scannedItems.filter((i) => i.isValid).map((i) => i.qrCode)),
    );
  }, [scannedItems]);

  const selectNone = useCallback(() => {
    setSelectedQrCodes(new Set());
  }, []);

  const clearAll = useCallback(() => {
    setScannedItems([]);
    setSelectedQrCodes(new Set());
  }, []);

  // Sort items
  const sortedItems = [...scannedItems].sort((a, b) => {
    let cmp = 0;
    switch (sortBy) {
      case 'qr':
        cmp = a.qrCode.localeCompare(b.qrCode);
        break;
      case 'status':
        cmp = (a.container?.status ?? '').localeCompare(
          b.container?.status ?? '',
        );
        break;
      case 'culture':
        cmp = (a.container?.culture?.name ?? '').localeCompare(
          b.container?.culture?.name ?? '',
        );
        break;
      case 'date':
        cmp = (a.container?.updatedAt ?? '').localeCompare(
          b.container?.updatedAt ?? '',
        );
        break;
    }
    return sortDir === 'desc' ? -cmp : cmp;
  });

  const validCount = scannedItems.filter((i) => i.isValid).length;
  const invalidCount = scannedItems.filter((i) => !i.isValid).length;

  return {
    scannedItems: sortedItems,
    rawItems: scannedItems,
    selectedAction,
    selectedQrCodes,
    sortBy,
    sortDir,
    viewMode,
    validCount,
    invalidCount,
    addQrCode,
    removeQrCode,
    changeAction,
    toggleSelection,
    selectAll,
    selectValid,
    selectNone,
    clearAll,
    setSortBy,
    setSortDir,
    setViewMode,
  };
}
