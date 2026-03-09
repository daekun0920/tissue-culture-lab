import { useState } from 'react';
import { Leaf, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useCultureTypes, useCreateCultureType } from '@/hooks/use-culture-types';
import { toast } from 'sonner';

export function CultureTab() {
  const { data: cultures, isLoading } = useCultureTypes();
  const createCulture = useCreateCultureType();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: '',
    species: '',
    clone: '',
    origin: '',
    defaultSubcultureInterval: '14',
  });

  const handleCreate = () => {
    if (!form.name.trim()) return;
    createCulture.mutate(
      {
        name: form.name.trim(),
        species: form.species.trim() || undefined,
        clone: form.clone.trim() || undefined,
        origin: form.origin.trim() || undefined,
        defaultSubcultureInterval: parseInt(form.defaultSubcultureInterval) || 14,
      },
      {
        onSuccess: () => {
          toast.success('Culture template created');
          setShowAdd(false);
          setForm({ name: '', species: '', clone: '', origin: '', defaultSubcultureInterval: '14' });
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
      {cultures?.map((culture) => (
        <div
          key={culture.id}
          className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-50">
            <Leaf className="h-5 w-5 text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900">{culture.name}</p>
            <p className="text-sm text-gray-500">
              {culture.species && <span className="italic">{culture.species}</span>}
              {culture.species && ' \u00b7 '}
              {culture._count?.containers ?? 0} containers
            </p>
          </div>
        </div>
      ))}

      {cultures?.length === 0 && (
        <p className="py-8 text-center text-gray-400">
          No culture templates yet.
        </p>
      )}

      <button
        onClick={() => setShowAdd(true)}
        className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl p-4 text-gray-500 hover:border-green-400 hover:text-green-600 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Add Culture Template
      </button>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Culture Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              placeholder="Species (optional)"
              value={form.species}
              onChange={(e) => setForm({ ...form, species: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Clone (optional)"
                value={form.clone}
                onChange={(e) => setForm({ ...form, clone: e.target.value })}
              />
              <Input
                placeholder="Origin (optional)"
                value={form.origin}
                onChange={(e) => setForm({ ...form, origin: e.target.value })}
              />
            </div>
            <Input
              placeholder="Subculture interval (days)"
              type="number"
              value={form.defaultSubcultureInterval}
              onChange={(e) =>
                setForm({ ...form, defaultSubcultureInterval: e.target.value })
              }
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!form.name.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
