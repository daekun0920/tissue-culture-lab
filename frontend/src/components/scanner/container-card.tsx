import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ScannedContainer } from '@/types';

interface ScannerContainerCardProps {
  item: ScannedContainer;
  selected: boolean;
  viewMode: 'essential' | 'full';
  onToggle: () => void;
  onRemove: () => void;
}

export function ScannerContainerCard({
  item,
  selected,
  viewMode,
  onToggle,
  onRemove,
}: ScannerContainerCardProps) {
  const { qrCode, container, isValid, invalidReason } = item;

  return (
    <div
      className={cn(
        'border rounded-lg p-3 flex items-start gap-3 transition-colors cursor-pointer',
        isValid
          ? 'border-green-200 bg-green-50/30'
          : 'border-red-200 bg-red-50/30',
        selected && isValid && 'ring-2 ring-green-400',
        selected && !isValid && 'ring-2 ring-red-400',
      )}
      onClick={onToggle}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={onToggle}
        className="mt-1 h-4 w-4 rounded border-gray-300"
        onClick={(e) => e.stopPropagation()}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono text-sm font-medium">{qrCode}</span>
          {isValid ? (
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs">
              Valid
            </Badge>
          ) : (
            <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-xs">
              Invalid
            </Badge>
          )}
        </div>

        <div className="text-xs text-gray-500 space-y-0.5">
          <p>
            Status: {container?.status ?? 'Not registered'}
            {container?.culture && ` | Culture: ${container.culture.name}`}
            {container?.media?.recipe &&
              ` | Media: ${container.media.recipe.name}`}
          </p>
          {viewMode === 'full' && container && (
            <>
              {container.containerType && (
                <p>Type: {container.containerType.name}</p>
              )}
              {container.dueSubcultureDate && (
                <p>
                  Due:{' '}
                  {new Date(container.dueSubcultureDate).toLocaleDateString()}
                </p>
              )}
              {container.notes && <p>Notes: {container.notes}</p>}
            </>
          )}
          {!isValid && invalidReason && (
            <p className="text-red-600 font-medium">{invalidReason}</p>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="text-gray-400 hover:text-red-500 text-sm px-1"
        title="Remove"
      >
        ✕
      </button>
    </div>
  );
}
