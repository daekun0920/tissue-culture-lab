import { useState, type KeyboardEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';

interface QrInputProps {
  onAdd: (qr: string) => void;
  onCameraToggle?: () => void;
  showCamera?: boolean;
}

function extractQrCode(raw: string): string {
  const trimmed = raw.trim();
  try {
    const url = new URL(trimmed);
    const segments = url.pathname.split('/').filter(Boolean);
    return segments[segments.length - 1] || trimmed;
  } catch {
    return trimmed;
  }
}

export function QrInput({ onAdd, onCameraToggle, showCamera }: QrInputProps) {
  const [value, setValue] = useState('');

  const handleAdd = () => {
    const qr = extractQrCode(value);
    if (qr) {
      onAdd(qr);
      setValue('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="flex gap-2">
      <Input
        placeholder="Scan or type QR code, press Enter"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="font-mono text-base h-12"
        autoFocus
      />
      <Button
        variant="outline"
        onClick={handleAdd}
        disabled={!value.trim()}
        className="h-12 px-4"
      >
        Add
      </Button>
      {showCamera !== false && (
        <Button
          variant="outline"
          onClick={onCameraToggle}
          className="h-12 px-3"
          title="Camera Scanner"
        >
          <Camera className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}
