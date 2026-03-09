import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Plus, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useRackDetail, useCreateShelf, useUpdateRack } from '@/hooks/use-locations';
import { toast } from 'sonner';

export default function RackDetailPage() {
  const { rackId } = useParams<{ rackId: string }>();
  const navigate = useNavigate();
  const { data: rack, isLoading } = useRackDetail(rackId!);
  const createShelf = useCreateShelf();
  const updateRack = useUpdateRack();

  const [showAddShelf, setShowAddShelf] = useState(false);
  const [showEditRack, setShowEditRack] = useState(false);
  const [shelfName, setShelfName] = useState('');
  const [editName, setEditName] = useState('');

  const handleCreateShelf = () => {
    if (!shelfName.trim() || !rackId) return;
    createShelf.mutate(
      { name: shelfName.trim(), rackId },
      {
        onSuccess: () => {
          toast.success('Shelf created');
          setShowAddShelf(false);
          setShelfName('');
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  const handleEditRack = () => {
    if (!editName.trim() || !rackId) return;
    updateRack.mutate(
      { id: rackId, data: { name: editName.trim() } },
      {
        onSuccess: () => {
          toast.success('Rack updated');
          setShowEditRack(false);
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  if (isLoading) {
    return <div className="py-8 text-center text-gray-400">Loading...</div>;
  }

  if (!rack) {
    return <div className="py-8 text-center text-gray-400">Rack not found</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-indigo-600 rounded-2xl p-6 text-white">
        <button
          onClick={() =>
            rack.zone
              ? navigate(`/library/zones/${rack.zoneId}`)
              : navigate('/library')
          }
          className="flex items-center gap-1 text-indigo-200 hover:text-white text-sm mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          {rack.zone ? rack.zone.name : 'Back'}
        </button>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold flex-1">{rack.name}</h1>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20"
            onClick={() => {
              setEditName(rack.name);
              setShowEditRack(true);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Shelves list */}
      <div className="space-y-3">
        {rack.shelves?.map((shelf) => (
          <div
            key={shelf.id}
            className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-50">
              <Package className="h-5 w-5 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900">{shelf.name}</p>
              <p className="text-sm text-gray-500">
                {shelf._count?.containers ?? 0} {(shelf._count?.containers ?? 0) === 1 ? 'container' : 'containers'}
              </p>
            </div>
          </div>
        ))}

        {(!rack.shelves || rack.shelves.length === 0) && (
          <p className="py-8 text-center text-gray-400">
            No shelves in this rack yet.
          </p>
        )}

        <button
          onClick={() => setShowAddShelf(true)}
          className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl p-4 text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Shelf
        </button>
      </div>

      {/* Add Shelf Dialog */}
      <Dialog open={showAddShelf} onOpenChange={setShowAddShelf}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Shelf to {rack.name}</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Shelf name"
            value={shelfName}
            onChange={(e) => setShelfName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateShelf()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddShelf(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateShelf} disabled={!shelfName.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Rack Dialog */}
      <Dialog open={showEditRack} onOpenChange={setShowEditRack}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Rack</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Rack name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleEditRack()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditRack(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditRack} disabled={!editName.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
