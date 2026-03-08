import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { SortBy, SortDir, ViewMode } from '@/hooks/use-scanner-state';

interface SortControlsProps {
  sortBy: SortBy;
  sortDir: SortDir;
  viewMode: ViewMode;
  onSortByChange: (v: SortBy) => void;
  onSortDirChange: (v: SortDir) => void;
  onViewModeChange: (v: ViewMode) => void;
}

export function SortControls({
  sortBy,
  sortDir,
  viewMode,
  onSortByChange,
  onSortDirChange,
  onViewModeChange,
}: SortControlsProps) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-gray-500 text-xs">Sort:</span>
      <Select value={sortBy} onValueChange={(v) => onSortByChange(v as SortBy)}>
        <SelectTrigger className="w-28 h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="qr">QR Code</SelectItem>
          <SelectItem value="status">Status</SelectItem>
          <SelectItem value="culture">Culture</SelectItem>
          <SelectItem value="date">Date</SelectItem>
        </SelectContent>
      </Select>

      <Button
        variant="ghost"
        size="sm"
        className="text-xs px-2"
        onClick={() => onSortDirChange(sortDir === 'asc' ? 'desc' : 'asc')}
      >
        {sortDir === 'asc' ? '↑' : '↓'}
      </Button>

      <div className="flex-1" />

      <span className="text-gray-500 text-xs">View:</span>
      <div className="flex border rounded-md overflow-hidden">
        <button
          type="button"
          className={`px-3 py-1 text-xs ${viewMode === 'essential' ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'}`}
          onClick={() => onViewModeChange('essential')}
        >
          Essential
        </button>
        <button
          type="button"
          className={`px-3 py-1 text-xs ${viewMode === 'full' ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'}`}
          onClick={() => onViewModeChange('full')}
        >
          Full
        </button>
      </div>
    </div>
  );
}
