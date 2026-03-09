import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';
import type { Container } from '@/types';

interface PickListItemProps {
  container: Container;
  variant: 'due' | 'expired';
}

const STATUS_COLORS: Record<string, string> = {
  EMPTY: 'bg-gray-100 text-gray-700',
  HAS_MEDIA: 'bg-amber-100 text-amber-700',
  HAS_CULTURE: 'bg-green-100 text-green-700',
  DISCARDED: 'bg-red-100 text-red-700',
};

export function PickListItem({ container, variant }: PickListItemProps) {
  const navigate = useNavigate();
  const locationParts: string[] = [];
  if (container.shelf?.rack?.zone?.name) locationParts.push(container.shelf.rack.zone.name);
  if (container.shelf?.rack?.name) locationParts.push(container.shelf.rack.name);
  if (container.shelf?.name) locationParts.push(container.shelf.name);
  const locationStr = locationParts.join(' > ');

  const dueDate = container.dueSubcultureDate
    ? new Date(container.dueSubcultureDate)
    : null;

  return (
    <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <code className="text-sm font-mono font-medium text-gray-900">
            {container.qrCode}
          </code>
          <Badge className={`text-xs ${STATUS_COLORS[container.status] ?? ''}`}>
            {container.status}
          </Badge>
        </div>
        {container.culture && (
          <p className="text-sm text-gray-700 mt-1">{container.culture.name}</p>
        )}
        {locationStr && (
          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {locationStr}
          </p>
        )}
        {dueDate && (
          <p className={`text-xs mt-0.5 ${variant === 'expired' ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
            Due: {dueDate.toLocaleDateString()}
          </p>
        )}
      </div>
      <Button
        size="sm"
        onClick={() => navigate(`/containers/${encodeURIComponent(container.qrCode)}`)}
      >
        Process
      </Button>
    </div>
  );
}
