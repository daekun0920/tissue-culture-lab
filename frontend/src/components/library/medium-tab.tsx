import { useState } from 'react';
import { FlaskConical, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useMediaRecipes, useCreateMediaRecipe } from '@/hooks/use-media-recipes';
import { toast } from 'sonner';

export function MediumTab() {
  const { data: recipes, isLoading } = useMediaRecipes();
  const createRecipe = useCreateMediaRecipe();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', baseType: '', phLevel: '5.8', agar: '0', hormones: '' });

  const handleCreate = () => {
    if (!form.name.trim() || !form.baseType.trim()) return;
    createRecipe.mutate(
      {
        name: form.name.trim(),
        baseType: form.baseType.trim(),
        phLevel: parseFloat(form.phLevel) || 5.8,
        agar: parseFloat(form.agar) || 0,
        hormones: form.hormones.trim(),
      },
      {
        onSuccess: () => {
          toast.success('Medium template created');
          setShowAdd(false);
          setForm({ name: '', baseType: '', phLevel: '5.8', agar: '0', hormones: '' });
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
      {recipes?.map((recipe) => (
        <div
          key={recipe.id}
          className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-50">
            <FlaskConical className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900">{recipe.name}</p>
            <p className="text-sm text-gray-500">
              {recipe.baseType} &middot; pH {recipe.phLevel} &middot;{' '}
              {recipe._count?.batches ?? 0} batches
            </p>
          </div>
        </div>
      ))}

      {recipes?.length === 0 && (
        <p className="py-8 text-center text-gray-400">
          No medium templates yet.
        </p>
      )}

      <button
        onClick={() => setShowAdd(true)}
        className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl p-4 text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Add Medium Template
      </button>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Medium Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              placeholder="Base type (e.g. MS, WPM)"
              value={form.baseType}
              onChange={(e) => setForm({ ...form, baseType: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="pH level"
                type="number"
                step="0.1"
                value={form.phLevel}
                onChange={(e) => setForm({ ...form, phLevel: e.target.value })}
              />
              <Input
                placeholder="Agar (g/L)"
                type="number"
                step="0.1"
                value={form.agar}
                onChange={(e) => setForm({ ...form, agar: e.target.value })}
              />
            </div>
            <Input
              placeholder="Hormones"
              value={form.hormones}
              onChange={(e) => setForm({ ...form, hormones: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!form.name.trim() || !form.baseType.trim()}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
