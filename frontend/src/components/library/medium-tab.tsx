import { useState } from 'react';
import { FlaskConical, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  useMediaRecipes,
  useCreateMediaRecipe,
  useUpdateMediaRecipe,
  useDeleteMediaRecipe,
} from '@/hooks/use-media-recipes';
import type { MediaRecipe } from '@/types';
import { toast } from 'sonner';
import { formatHormones, hormonesToJson } from '@/lib/format';

const emptyForm = { name: '', baseType: '', phLevel: '5.8', agar: '0', hormones: '' };

export function MediumTab() {
  const { data: recipes, isLoading } = useMediaRecipes();
  const createRecipe = useCreateMediaRecipe();
  const updateRecipe = useUpdateMediaRecipe();
  const deleteRecipe = useDeleteMediaRecipe();

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const [editing, setEditing] = useState<MediaRecipe | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);

  const [deleting, setDeleting] = useState<MediaRecipe | null>(null);

  const handleCreate = () => {
    if (!form.name.trim() || !form.baseType.trim()) return;
    createRecipe.mutate(
      {
        name: form.name.trim(),
        baseType: form.baseType.trim(),
        phLevel: parseFloat(form.phLevel) || 5.8,
        agar: parseFloat(form.agar) || 0,
        hormones: hormonesToJson(form.hormones.trim()),
      },
      {
        onSuccess: () => {
          toast.success('Medium template created');
          setShowAdd(false);
          setForm(emptyForm);
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  const openEdit = (recipe: MediaRecipe) => {
    setEditing(recipe);
    setEditForm({
      name: recipe.name,
      baseType: recipe.baseType,
      phLevel: String(recipe.phLevel),
      agar: String(recipe.agar),
      hormones: formatHormones(recipe.hormones),
    });
  };

  const handleUpdate = () => {
    if (!editing || !editForm.name.trim() || !editForm.baseType.trim()) return;
    updateRecipe.mutate(
      {
        id: editing.id,
        data: {
          name: editForm.name.trim(),
          baseType: editForm.baseType.trim(),
          phLevel: parseFloat(editForm.phLevel) || 5.8,
          agar: parseFloat(editForm.agar) || 0,
          hormones: hormonesToJson(editForm.hormones.trim()),
        },
      },
      {
        onSuccess: () => {
          toast.success('Medium template updated');
          setEditing(null);
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  const handleDelete = () => {
    if (!deleting) return;
    deleteRecipe.mutate(deleting.id, {
      onSuccess: () => {
        toast.success('Medium template deleted');
        setDeleting(null);
      },
      onError: (err) => toast.error(err.message),
    });
  };

  if (isLoading) {
    return <div className="py-8 text-center text-gray-400">Loading...</div>;
  }

  const formFields = (
    f: typeof form,
    setF: React.Dispatch<React.SetStateAction<typeof form>>,
  ) => (
    <div className="space-y-3">
      <Input
        placeholder="Name"
        value={f.name}
        onChange={(e) => setF({ ...f, name: e.target.value })}
      />
      <Input
        placeholder="Base type (e.g. MS, WPM)"
        value={f.baseType}
        onChange={(e) => setF({ ...f, baseType: e.target.value })}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          placeholder="pH level"
          type="number"
          step="0.1"
          value={f.phLevel}
          onChange={(e) => setF({ ...f, phLevel: e.target.value })}
        />
        <Input
          placeholder="Agar (g/L)"
          type="number"
          step="0.1"
          value={f.agar}
          onChange={(e) => setF({ ...f, agar: e.target.value })}
        />
      </div>
      <Input
        placeholder="Hormones"
        value={f.hormones}
        onChange={(e) => setF({ ...f, hormones: e.target.value })}
      />
    </div>
  );

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
              {recipe._count?.batches ?? 0}{' '}
              {(recipe._count?.batches ?? 0) === 1 ? 'batch' : 'batches'}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="sm" onClick={() => openEdit(recipe)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDeleting(recipe)}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
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

      {/* Create dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Medium Template</DialogTitle>
            <DialogDescription className="text-sm text-gray-500">Enter details to create a new medium template</DialogDescription>
          </DialogHeader>
          {formFields(form, setForm)}
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

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Medium Template</DialogTitle>
            <DialogDescription className="text-sm text-gray-500">Update medium template information</DialogDescription>
          </DialogHeader>
          {formFields(editForm, setEditForm)}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={
                !editForm.name.trim() ||
                !editForm.baseType.trim() ||
                updateRecipe.isPending
              }
            >
              {updateRecipe.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Medium Template</DialogTitle>
            <DialogDescription className="text-sm text-gray-600">
              Are you sure you want to delete <strong>{deleting?.name}</strong>? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteRecipe.isPending}
            >
              {deleteRecipe.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
