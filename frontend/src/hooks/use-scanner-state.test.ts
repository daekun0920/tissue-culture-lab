import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/lib/api', () => ({
  containerApi: { getByQr: vi.fn() },
}));

import { containerApi } from '@/lib/api';
import { renderHook, act } from '@testing-library/react';
import { useScannerState } from './use-scanner-state';
import type { Container } from '@/types';

// ─── Helpers ─────────────────────────────────────────────────────

const mockGetByQr = containerApi.getByQr as ReturnType<typeof vi.fn>;

function makeContainer(overrides: Partial<Container> = {}): Container {
  return {
    qrCode: '1001',
    status: 'EMPTY',
    containerTypeId: null,
    mediaId: null,
    cultureId: null,
    parentId: null,
    shelfId: null,
    notes: null,
    cultureDate: null,
    subcultureInterval: null,
    dueSubcultureDate: null,
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useScannerState', () => {
  // ── addQrCode ────────────────────────────────────────────────

  describe('addQrCode', () => {
    it('adds a QR code, fetches container from API, returns "added"', async () => {
      const container = makeContainer({ qrCode: '1001' });
      mockGetByQr.mockResolvedValueOnce(container);

      const { result } = renderHook(() => useScannerState());

      let status: string | undefined;
      await act(async () => {
        status = await result.current.addQrCode('1001');
      });

      expect(status).toBe('added');
      expect(mockGetByQr).toHaveBeenCalledWith('1001');
      expect(result.current.scannedItems).toHaveLength(1);
      expect(result.current.scannedItems[0].qrCode).toBe('1001');
      expect(result.current.scannedItems[0].container).toEqual(container);
    });

    it('does not duplicate an already-added QR', async () => {
      mockGetByQr.mockResolvedValue(makeContainer({ qrCode: '1001' }));

      const { result } = renderHook(() => useScannerState());

      await act(async () => {
        await result.current.addQrCode('1001');
      });

      await act(async () => {
        await result.current.addQrCode('1001');
      });

      // Regardless of return value, the item must not be duplicated
      expect(result.current.scannedItems).toHaveLength(1);
      expect(result.current.scannedItems[0].qrCode).toBe('1001');
    });

    it('trims whitespace and ignores empty strings', async () => {
      mockGetByQr.mockResolvedValue(makeContainer({ qrCode: '1001' }));

      const { result } = renderHook(() => useScannerState());

      await act(async () => {
        await result.current.addQrCode('   ');
      });
      expect(result.current.scannedItems).toHaveLength(0);

      await act(async () => {
        await result.current.addQrCode('');
      });
      expect(result.current.scannedItems).toHaveLength(0);

      await act(async () => {
        await result.current.addQrCode('  1001  ');
      });
      expect(result.current.scannedItems).toHaveLength(1);
      expect(result.current.scannedItems[0].qrCode).toBe('1001');
    });

    it('creates item with null container when API throws', async () => {
      mockGetByQr.mockRejectedValueOnce(new Error('Not found'));

      const { result } = renderHook(() => useScannerState());

      await act(async () => {
        await result.current.addQrCode('9999');
      });

      expect(result.current.scannedItems).toHaveLength(1);
      expect(result.current.scannedItems[0].container).toBeNull();
    });

    it('auto-selects valid items', async () => {
      mockGetByQr.mockResolvedValueOnce(makeContainer({ qrCode: '1001' }));

      const { result } = renderHook(() => useScannerState());

      // No action selected → all valid → should auto-select
      await act(async () => {
        await result.current.addQrCode('1001');
      });

      expect(result.current.scannedItems[0].isValid).toBe(true);
      expect(result.current.selectedQrCodes.has('1001')).toBe(true);
    });
  });

  // ── changeAction ─────────────────────────────────────────────

  describe('changeAction', () => {
    it('sets selectedAction', async () => {
      const { result } = renderHook(() => useScannerState());

      act(() => {
        result.current.changeAction('PREPARE_MEDIA');
      });

      expect(result.current.selectedAction).toBe('PREPARE_MEDIA');
    });

    it('revalidates all items when action changes', async () => {
      // Start with an EMPTY container (no action = valid)
      mockGetByQr.mockResolvedValueOnce(
        makeContainer({ qrCode: '1001', status: 'EMPTY' }),
      );

      const { result } = renderHook(() => useScannerState());

      await act(async () => {
        await result.current.addQrCode('1001');
      });
      expect(result.current.scannedItems[0].isValid).toBe(true);

      // Change to ADD_CULTURE → EMPTY is invalid for ADD_CULTURE
      act(() => {
        result.current.changeAction('ADD_CULTURE');
      });

      expect(result.current.scannedItems[0].isValid).toBe(false);
    });

    it('updates selection to only valid items', async () => {
      mockGetByQr
        .mockResolvedValueOnce(makeContainer({ qrCode: '1001', status: 'EMPTY' }))
        .mockResolvedValueOnce(
          makeContainer({ qrCode: '1002', status: 'HAS_MEDIA' }),
        );

      const { result } = renderHook(() => useScannerState());

      await act(async () => {
        await result.current.addQrCode('1001');
      });
      await act(async () => {
        await result.current.addQrCode('1002');
      });

      // Both selected (no action → all valid)
      expect(result.current.selectedQrCodes.has('1001')).toBe(true);
      expect(result.current.selectedQrCodes.has('1002')).toBe(true);

      // Change to PREPARE_MEDIA → only EMPTY valid
      act(() => {
        result.current.changeAction('PREPARE_MEDIA');
      });

      expect(result.current.selectedQrCodes.has('1001')).toBe(true);
      expect(result.current.selectedQrCodes.has('1002')).toBe(false);
    });
  });

  // ── Validation ───────────────────────────────────────────────

  describe('validation via addQrCode with different actions', () => {
    it('no action → all items are valid', async () => {
      mockGetByQr.mockResolvedValueOnce(
        makeContainer({ qrCode: '1001', status: 'EMPTY' }),
      );

      const { result } = renderHook(() => useScannerState());

      await act(async () => {
        await result.current.addQrCode('1001');
      });

      expect(result.current.scannedItems[0].isValid).toBe(true);
    });

    it('REGISTER_CONTAINER → valid when container is null, invalid when exists', async () => {
      // Null container (API error) → valid for REGISTER
      mockGetByQr.mockRejectedValueOnce(new Error('Not found'));

      const { result } = renderHook(() => useScannerState());

      act(() => {
        result.current.changeAction('REGISTER_CONTAINER');
      });

      await act(async () => {
        await result.current.addQrCode('NEW-1');
      });

      expect(result.current.scannedItems[0].isValid).toBe(true);

      // Existing container → invalid for REGISTER
      mockGetByQr.mockResolvedValueOnce(
        makeContainer({ qrCode: 'OLD-1', status: 'EMPTY' }),
      );

      await act(async () => {
        await result.current.addQrCode('OLD-1');
      });

      const oldItem = result.current.scannedItems.find(
        (i) => i.qrCode === 'OLD-1',
      );
      expect(oldItem?.isValid).toBe(false);
      expect(oldItem?.invalidReason).toBe('Already registered');
    });

    it('PREPARE_MEDIA → valid for EMPTY only', async () => {
      mockGetByQr
        .mockResolvedValueOnce(makeContainer({ qrCode: '1001', status: 'EMPTY' }))
        .mockResolvedValueOnce(
          makeContainer({ qrCode: '1002', status: 'HAS_MEDIA' }),
        );

      const { result } = renderHook(() => useScannerState());

      act(() => {
        result.current.changeAction('PREPARE_MEDIA');
      });

      await act(async () => {
        await result.current.addQrCode('1001');
      });
      await act(async () => {
        await result.current.addQrCode('1002');
      });

      const empty = result.current.scannedItems.find(
        (i) => i.qrCode === '1001',
      );
      const hasMedia = result.current.scannedItems.find(
        (i) => i.qrCode === '1002',
      );

      expect(empty?.isValid).toBe(true);
      expect(hasMedia?.isValid).toBe(false);
    });

    it('ADD_CULTURE → valid for HAS_MEDIA only', async () => {
      mockGetByQr
        .mockResolvedValueOnce(
          makeContainer({ qrCode: '1001', status: 'HAS_MEDIA' }),
        )
        .mockResolvedValueOnce(
          makeContainer({ qrCode: '1002', status: 'EMPTY' }),
        );

      const { result } = renderHook(() => useScannerState());

      act(() => {
        result.current.changeAction('ADD_CULTURE');
      });

      await act(async () => {
        await result.current.addQrCode('1001');
      });
      await act(async () => {
        await result.current.addQrCode('1002');
      });

      const hasMedia = result.current.scannedItems.find(
        (i) => i.qrCode === '1001',
      );
      const empty = result.current.scannedItems.find(
        (i) => i.qrCode === '1002',
      );

      expect(hasMedia?.isValid).toBe(true);
      expect(empty?.isValid).toBe(false);
    });

    it('DISCARD_CULTURE → valid for HAS_CULTURE only', async () => {
      mockGetByQr
        .mockResolvedValueOnce(
          makeContainer({ qrCode: '1001', status: 'HAS_CULTURE' }),
        )
        .mockResolvedValueOnce(
          makeContainer({ qrCode: '1002', status: 'EMPTY' }),
        );

      const { result } = renderHook(() => useScannerState());

      act(() => {
        result.current.changeAction('DISCARD_CULTURE');
      });

      await act(async () => {
        await result.current.addQrCode('1001');
      });
      await act(async () => {
        await result.current.addQrCode('1002');
      });

      const hasCulture = result.current.scannedItems.find(
        (i) => i.qrCode === '1001',
      );
      const empty = result.current.scannedItems.find(
        (i) => i.qrCode === '1002',
      );

      expect(hasCulture?.isValid).toBe(true);
      expect(empty?.isValid).toBe(false);
    });

    it('WASH → valid for DISCARDED only', async () => {
      mockGetByQr
        .mockResolvedValueOnce(
          makeContainer({ qrCode: '1001', status: 'DISCARDED' }),
        )
        .mockResolvedValueOnce(
          makeContainer({ qrCode: '1002', status: 'EMPTY' }),
        );

      const { result } = renderHook(() => useScannerState());

      act(() => {
        result.current.changeAction('WASH');
      });

      await act(async () => {
        await result.current.addQrCode('1001');
      });
      await act(async () => {
        await result.current.addQrCode('1002');
      });

      const discarded = result.current.scannedItems.find(
        (i) => i.qrCode === '1001',
      );
      const empty = result.current.scannedItems.find(
        (i) => i.qrCode === '1002',
      );

      expect(discarded?.isValid).toBe(true);
      expect(empty?.isValid).toBe(false);
    });
  });

  // ── removeQrCode ─────────────────────────────────────────────

  describe('removeQrCode', () => {
    it('removes from items and selection', async () => {
      mockGetByQr.mockResolvedValueOnce(makeContainer({ qrCode: '1001' }));

      const { result } = renderHook(() => useScannerState());

      await act(async () => {
        await result.current.addQrCode('1001');
      });
      expect(result.current.scannedItems).toHaveLength(1);
      expect(result.current.selectedQrCodes.has('1001')).toBe(true);

      act(() => {
        result.current.removeQrCode('1001');
      });

      expect(result.current.scannedItems).toHaveLength(0);
      expect(result.current.selectedQrCodes.has('1001')).toBe(false);
    });
  });

  // ── toggleSelection ──────────────────────────────────────────

  describe('toggleSelection', () => {
    it('adds and removes from selection', async () => {
      mockGetByQr.mockResolvedValueOnce(makeContainer({ qrCode: '1001' }));

      const { result } = renderHook(() => useScannerState());

      await act(async () => {
        await result.current.addQrCode('1001');
      });
      // Auto-selected since valid
      expect(result.current.selectedQrCodes.has('1001')).toBe(true);

      // Toggle off
      act(() => {
        result.current.toggleSelection('1001');
      });
      expect(result.current.selectedQrCodes.has('1001')).toBe(false);

      // Toggle back on
      act(() => {
        result.current.toggleSelection('1001');
      });
      expect(result.current.selectedQrCodes.has('1001')).toBe(true);
    });
  });

  // ── Bulk selection ops ───────────────────────────────────────

  describe('selectAll / selectValid / selectNone / clearAll', () => {
    async function setupMultipleItems() {
      mockGetByQr
        .mockResolvedValueOnce(makeContainer({ qrCode: '1001', status: 'EMPTY' }))
        .mockResolvedValueOnce(
          makeContainer({ qrCode: '1002', status: 'HAS_MEDIA' }),
        );

      const hook = renderHook(() => useScannerState());

      await act(async () => {
        await hook.result.current.addQrCode('1001');
      });
      await act(async () => {
        await hook.result.current.addQrCode('1002');
      });

      // Set action so one is valid and one is not
      act(() => {
        hook.result.current.changeAction('PREPARE_MEDIA');
      });

      return hook;
    }

    it('selectAll selects every item', async () => {
      const { result } = await setupMultipleItems();

      act(() => {
        result.current.selectAll();
      });

      expect(result.current.selectedQrCodes.has('1001')).toBe(true);
      expect(result.current.selectedQrCodes.has('1002')).toBe(true);
    });

    it('selectValid selects only valid items', async () => {
      const { result } = await setupMultipleItems();

      // First select all
      act(() => {
        result.current.selectAll();
      });

      // Then select valid only
      act(() => {
        result.current.selectValid();
      });

      // 1001 is EMPTY → valid for PREPARE_MEDIA
      expect(result.current.selectedQrCodes.has('1001')).toBe(true);
      // 1002 is HAS_MEDIA → invalid for PREPARE_MEDIA
      expect(result.current.selectedQrCodes.has('1002')).toBe(false);
    });

    it('selectNone clears selection', async () => {
      const { result } = await setupMultipleItems();

      act(() => {
        result.current.selectNone();
      });

      expect(result.current.selectedQrCodes.size).toBe(0);
    });

    it('clearAll removes all items and selection', async () => {
      const { result } = await setupMultipleItems();

      act(() => {
        result.current.clearAll();
      });

      expect(result.current.scannedItems).toHaveLength(0);
      expect(result.current.selectedQrCodes.size).toBe(0);
    });
  });

  // ── Sorting ──────────────────────────────────────────────────

  describe('sorting', () => {
    async function setupForSorting() {
      mockGetByQr
        .mockResolvedValueOnce(
          makeContainer({
            qrCode: 'B-002',
            status: 'HAS_MEDIA',
            updatedAt: '2025-03-01',
          }),
        )
        .mockResolvedValueOnce(
          makeContainer({
            qrCode: 'A-001',
            status: 'EMPTY',
            updatedAt: '2025-01-01',
            culture: { id: 'c1', name: 'Orchid', defaultSubcultureInterval: 14 },
          }),
        )
        .mockResolvedValueOnce(
          makeContainer({
            qrCode: 'C-003',
            status: 'HAS_CULTURE',
            updatedAt: '2025-02-01',
            culture: {
              id: 'c2',
              name: 'Bamboo',
              defaultSubcultureInterval: 7,
            },
          }),
        );

      const hook = renderHook(() => useScannerState());

      await act(async () => {
        await hook.result.current.addQrCode('B-002');
      });
      await act(async () => {
        await hook.result.current.addQrCode('A-001');
      });
      await act(async () => {
        await hook.result.current.addQrCode('C-003');
      });

      return hook;
    }

    it('sorts by qr asc (default)', async () => {
      const { result } = await setupForSorting();

      const qrs = result.current.scannedItems.map((i) => i.qrCode);
      expect(qrs).toEqual(['A-001', 'B-002', 'C-003']);
    });

    it('sorts by qr desc', async () => {
      const { result } = await setupForSorting();

      act(() => {
        result.current.setSortDir('desc');
      });

      const qrs = result.current.scannedItems.map((i) => i.qrCode);
      expect(qrs).toEqual(['C-003', 'B-002', 'A-001']);
    });

    it('sorts by status', async () => {
      const { result } = await setupForSorting();

      act(() => {
        result.current.setSortBy('status');
      });

      const statuses = result.current.scannedItems.map(
        (i) => i.container?.status,
      );
      expect(statuses).toEqual(['EMPTY', 'HAS_CULTURE', 'HAS_MEDIA']);
    });

    it('sorts by culture name', async () => {
      const { result } = await setupForSorting();

      act(() => {
        result.current.setSortBy('culture');
      });

      // '' (no culture) < 'Bamboo' < 'Orchid'
      const names = result.current.scannedItems.map(
        (i) => i.container?.culture?.name ?? '',
      );
      expect(names).toEqual(['', 'Bamboo', 'Orchid']);
    });

    it('sorts by date', async () => {
      const { result } = await setupForSorting();

      act(() => {
        result.current.setSortBy('date');
      });

      const dates = result.current.scannedItems.map(
        (i) => i.container?.updatedAt,
      );
      expect(dates).toEqual(['2025-01-01', '2025-02-01', '2025-03-01']);
    });

    it('sorts by date desc', async () => {
      const { result } = await setupForSorting();

      act(() => {
        result.current.setSortBy('date');
        result.current.setSortDir('desc');
      });

      const dates = result.current.scannedItems.map(
        (i) => i.container?.updatedAt,
      );
      expect(dates).toEqual(['2025-03-01', '2025-02-01', '2025-01-01']);
    });
  });
});
