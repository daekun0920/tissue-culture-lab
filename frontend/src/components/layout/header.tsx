import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

function extractQrCode(raw: string): string {
  const trimmed = raw.trim();
  // If it looks like a URL, extract the last path segment
  try {
    const url = new URL(trimmed);
    const segments = url.pathname.split('/').filter(Boolean);
    return segments[segments.length - 1] || trimmed;
  } catch {
    // Not a URL, return as-is
    return trimmed;
  }
}

export function Header() {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const qr = extractQrCode(search);
    if (qr) {
      navigate(`/containers/${encodeURIComponent(qr)}`);
      setSearch('');
    }
  }

  return (
    <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6">
      <div />

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Quick QR lookup..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 w-64"
          />
        </div>
      </form>
    </header>
  );
}
