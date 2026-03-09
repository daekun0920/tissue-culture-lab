import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useShelfDetail, useUpdateShelf } from '@/hooks/use-locations';
import { toast } from 'sonner';

export default function ShelfDetailPage() {
  const { shelfId } = useParams<{ shelfId: string }>();
  const navigate = useNavigate();
  const { data: shelf, isLoading } = useShelfDetail(shelfId!);
  const updateShelf = useUpdateShelf();

  const [showEditShelf, setShowEditShelf] = useState(false);
  const [editName, setEditName] = useState('');

  const handleEditShelf = () => {
    if (!editName.trim() || !shelfId) return;
    updateShelf.mutate(
      { id: shelfId, data: { name: editName.trim() } },
      {
        onSuccess: () => {
          toast.success('Shelf updated');
          setShowEditShelf(false);
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  if (isLoading) {
    return <div className="py-8 text-center text-gray-400">Loading...</div>;
  }

  if (!shelf) {
    return <div className="py-8 text-center text-gray-400">Shelf not found</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-indigo-600 rounded-2xl p-6 text-white">
        <button
          onClick={() =>
            shelf.rack
              ? navigate(`/library/racks/${shelf.rackId}`)
              : navigate('/library')
          }
          className="flex items-center gap-1 text-indigo-200 hover:text-white text-sm mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          {shelf.rack ? shelf.rack.name : 'Back'}
        </button>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold flex-1">{shelf.name}</h1>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20"
            onClick={() => {
              setEditName(shelf.name);
              setShowEditShelf(true);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Containers list */}
      <div className="space-y-3">
        {shelf.containers?.map((container) => (
          <button
            key={container.qrCode}
            onClick={() => navigate(`/containers/${container.qrCode}`)}
            className="w-full flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors text-left"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-50">
              <Package className="h-5 w-5 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 font-mono text-sm">{container.qrCode}</p>
              <p className="text-sm text-gray-500">
                {container.status.replace(/_/g, ' ')}
                {container.culture && ` · ${container.culture.name}`}
              </p>
            </div>
          </button>
        ))}

        {(!shelf.containers || shelf.containers.length === 0) && (
          <p className="py-8 text-center text-gray-400">
            No containers on this shelf yet.
          </p>
        )}
      </div>

      {/* Edit Shelf Dialog */}
      <Dialog open={showEditShelf} onOpenChange={setShowEditShelf}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Shelf</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Shelf name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleEditShelf()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditShelf(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditShelf} disabled={!editName.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
