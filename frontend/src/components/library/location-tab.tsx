import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useZones, useCreateZone, useDeleteZone } from '@/hooks/use-locations';
import { toast } from 'sonner';

export function LocationTab() {
  const navigate = useNavigate();
  const { data: zones, isLoading } = useZones();
  const createZone = useCreateZone();
  const deleteZone = useDeleteZone();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');

  const handleCreate = () => {
    if (!newName.trim()) return;
    createZone.mutate(
      { name: newName.trim() },
      {
        onSuccess: () => {
          toast.success('Zone created');
          setShowAdd(false);
          setNewName('');
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  if (isLoading) {
    return <div className="py-8 text-center text-gray-400">Loading...</div>;
  }

  return (
    <div className="space-y-3">
      {zones?.map((zone) => (
        <button
          key={zone.id}
          onClick={() => navigate(`/library/zones/${zone.id}`)}
          className="w-full flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors text-left"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-50">
            <MapPin className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900">{zone.name}</p>
            <p className="text-sm text-gray-500">
              {zone._count?.racks ?? 0} racks &middot;{' '}
              {zone._count?.containers ?? 0} containers
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400 shrink-0" />
        </button>
      ))}

      {zones?.length === 0 && (
        <p className="py-8 text-center text-gray-400">
          No zones yet. Create one to get started.
        </p>
      )}

      <button
        onClick={() => setShowAdd(true)}
        className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl p-4 text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Add New Zone
      </button>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Zone</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Zone name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!newName.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
