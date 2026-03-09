import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface PickListSectionProps {
  title: string;
  count: number;
  borderColor: string;
  bgColor?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function PickListSection({
  title,
  count,
  borderColor,
  bgColor,
  children,
  defaultOpen = true,
}: PickListSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`border-l-4 ${borderColor} rounded-r-xl ${bgColor ?? ''}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <span className="font-medium text-gray-900">
          {title} ({count})
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>
      {open && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  );
}
