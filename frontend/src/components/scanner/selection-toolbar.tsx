import { Button } from '@/components/ui/button';

interface SelectionToolbarProps {
  totalCount: number;
  validCount: number;
  invalidCount: number;
  selectedCount: number;
  onSelectAll: () => void;
  onSelectValid: () => void;
  onSelectNone: () => void;
  onClearAll: () => void;
}

export function SelectionToolbar({
  totalCount,
  validCount,
  invalidCount,
  selectedCount,
  onSelectAll,
  onSelectValid,
  onSelectNone,
  onClearAll,
}: SelectionToolbarProps) {
  if (totalCount === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <Button
        variant="outline"
        size="sm"
        onClick={onSelectAll}
        className="text-xs"
      >
        Select All ({totalCount})
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onSelectValid}
        className="text-xs"
      >
        Valid ({validCount})
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onSelectNone}
        className="text-xs"
      >
        None
      </Button>
      <div className="flex-1" />
      <span className="text-xs text-gray-500">
        {selectedCount} selected
        {invalidCount > 0 && (
          <span className="text-red-500 ml-1">({invalidCount} invalid)</span>
        )}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={onClearAll}
        className="text-xs text-red-500 hover:text-red-700"
      >
        Clear All
      </Button>
    </div>
  );
}
