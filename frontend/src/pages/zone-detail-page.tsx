import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, ChevronRight, Plus, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useZoneDetail, useCreateRack, useUpdateZone } from '@/hooks/use-locations';
import { toast } from 'sonner';

export default function ZoneDetailPage() {
  const { zoneId } = useParams<{ zoneId: string }>();
  const navigate = useNavigate();
  const { data: zone, isLoading } = useZoneDetail(zoneId!);
  const createRack = useCreateRack();
  const updateZone = useUpdateZone();

  const [showAddRack, setShowAddRack] = useState(false);
  const [showEditZone, setShowEditZone] = useState(false);
  const [rackName, setRackName] = useState('');
  const [editName, setEditName] = useState('');

  const handleCreateRack = () => {
    if (!rackName.trim() || !zoneId) return;
    createRack.mutate(
      { name: rackName.trim(), zoneId },
      {
        onSuccess: () => {
          toast.success('Rack created');
          setShowAddRack(false);
          setRackName('');
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  const handleEditZone = () => {
    if (!editName.trim() || !zoneId) return;
    updateZone.mutate(
      { id: zoneId, data: { name: editName.trim() } },
      {
        onSuccess: () => {
          toast.success('Zone updated');
          setShowEditZone(false);
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  if (isLoading) {
    return <div className="py-8 text-center text-gray-400">Loading...</div>;
  }

  if (!zone) {
    return <div className="py-8 text-center text-gray-400">Zone not found</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-indigo-600 rounded-2xl p-6 text-white">
        <button
          onClick={() => navigate('/library')}
          className="flex items-center gap-1 text-indigo-200 hover:text-white text-sm mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Library
        </button>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/20">
            <MapPin className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-bold flex-1">{zone.name}</h1>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20"
            onClick={() => {
              setEditName(zone.name);
              setShowEditZone(true);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Racks list */}
      <div className="space-y-3">
        {zone.racks?.map((rack) => (
          <button
            key={rack.id}
            onClick={() => navigate(`/library/racks/${rack.id}`)}
            className="w-full flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors text-left"
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900">{rack.name}</p>
              <p className="text-sm text-gray-500">
                {rack._count?.shelves ?? 0} shelves &middot;{' '}
                {rack._count?.containers ?? 0} containers
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400 shrink-0" />
          </button>
        ))}

        {(!zone.racks || zone.racks.length === 0) && (
          <p className="py-8 text-center text-gray-400">
            No racks in this zone yet.
          </p>
        )}

        <button
          onClick={() => setShowAddRack(true)}
          className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl p-4 text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Rack
        </button>
      </div>

      {/* Add Rack Dialog */}
      <Dialog open={showAddRack} onOpenChange={setShowAddRack}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Rack to {zone.name}</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Rack name"
            value={rackName}
            onChange={(e) => setRackName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateRack()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddRack(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateRack} disabled={!rackName.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Zone Dialog */}
      <Dialog open={showEditZone} onOpenChange={setShowEditZone}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Zone</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Zone name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleEditZone()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditZone(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditZone} disabled={!editName.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
