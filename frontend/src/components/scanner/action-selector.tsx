import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ActionType } from '@/types';

const ACTIONS: { value: ActionType; label: string; description: string }[] = [
  { value: 'REGISTER_CONTAINER', label: 'Register Container', description: 'Register new QR codes as containers' },
  { value: 'PREPARE_MEDIA', label: 'Prepare Media', description: 'Add media to empty containers' },
  { value: 'ADD_CULTURE', label: 'Add Culture', description: 'Inoculate containers with culture' },
  { value: 'DISCARD_CULTURE', label: 'Discard Culture', description: 'Remove culture (contamination, etc.)' },
  { value: 'DISCARD_CONTAINER', label: 'Discard Container', description: 'Retire the container' },
  { value: 'SUBCULTURE', label: 'Subculture', description: 'Transfer culture to new containers' },
  { value: 'EXIT_CULTURE', label: 'Exit Culture', description: 'Sold or removed for growth' },
  { value: 'WASH', label: 'Wash', description: 'Clean discarded container for reuse' },
];

interface ActionSelectorProps {
  value: ActionType | null;
  onChange: (action: ActionType | null) => void;
}

export function ActionSelector({ value, onChange }: ActionSelectorProps) {
  return (
    <Select
      value={value ?? ''}
      onValueChange={(v) => onChange(v ? (v as ActionType) : null)}
    >
      <SelectTrigger className="h-11">
        <SelectValue placeholder="Select an action..." />
      </SelectTrigger>
      <SelectContent>
        {ACTIONS.map((action) => (
          <SelectItem key={action.value} value={action.value}>
            <span className="font-medium">{action.label}</span>
            <span className="text-xs text-gray-400 ml-2">
              {action.description}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
