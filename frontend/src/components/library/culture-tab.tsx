import { useState } from 'react';
import { Leaf, Plus, Pencil, Trash2 } from 'lucide-react';
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
  useCultureTypes,
  useCreateCultureType,
  useUpdateCultureType,
  useDeleteCultureType,
} from '@/hooks/use-culture-types';
import type { CultureType } from '@/types';
import { toast } from 'sonner';

const emptyForm = {
  name: '',
  species: '',
  clone: '',
  origin: '',
  defaultSubcultureInterval: '14',
};

export function CultureTab() {
  const { data: cultures, isLoading } = useCultureTypes();
  const createCulture = useCreateCultureType();
  const updateCulture = useUpdateCultureType();
  const deleteCulture = useDeleteCultureType();

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const [editing, setEditing] = useState<CultureType | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);

  const [deleting, setDeleting] = useState<CultureType | null>(null);

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
          setForm(emptyForm);
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  const openEdit = (culture: CultureType) => {
    setEditing(culture);
    setEditForm({
      name: culture.name,
      species: culture.species ?? '',
      clone: culture.clone ?? '',
      origin: culture.origin ?? '',
      defaultSubcultureInterval: String(culture.defaultSubcultureInterval),
    });
  };

  const handleUpdate = () => {
    if (!editing || !editForm.name.trim()) return;
    updateCulture.mutate(
      {
        id: editing.id,
        data: {
          name: editForm.name.trim(),
          species: editForm.species.trim() || null,
          clone: editForm.clone.trim() || null,
          origin: editForm.origin.trim() || null,
          defaultSubcultureInterval:
            parseInt(editForm.defaultSubcultureInterval) || 14,
        },
      },
      {
        onSuccess: () => {
          toast.success('Culture template updated');
          setEditing(null);
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  const handleDelete = () => {
    if (!deleting) return;
    deleteCulture.mutate(deleting.id, {
      onSuccess: () => {
        toast.success('Culture template deleted');
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
        placeholder="Species (optional)"
        value={f.species}
        onChange={(e) => setF({ ...f, species: e.target.value })}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          placeholder="Clone (optional)"
          value={f.clone}
          onChange={(e) => setF({ ...f, clone: e.target.value })}
        />
        <Input
          placeholder="Origin (optional)"
          value={f.origin}
          onChange={(e) => setF({ ...f, origin: e.target.value })}
        />
      </div>
      <Input
        placeholder="Subculture interval (days)"
        type="number"
        value={f.defaultSubcultureInterval}
        onChange={(e) =>
          setF({ ...f, defaultSubcultureInterval: e.target.value })
        }
      />
    </div>
  );

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
              {culture._count?.containers ?? 0}{' '}
              {(culture._count?.containers ?? 0) === 1 ? 'container' : 'containers'}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="sm" onClick={() => openEdit(culture)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDeleting(culture)}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
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

      {/* Create dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Culture Template</DialogTitle>
            <DialogDescription className="text-sm text-gray-500">Enter details to create a new culture template</DialogDescription>
          </DialogHeader>
          {formFields(form, setForm)}
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

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Culture Template</DialogTitle>
            <DialogDescription className="text-sm text-gray-500">Update culture template information</DialogDescription>
          </DialogHeader>
          {formFields(editForm, setEditForm)}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={!editForm.name.trim() || updateCulture.isPending}
            >
              {updateCulture.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Culture Template</DialogTitle>
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
              disabled={deleteCulture.isPending}
            >
              {deleteCulture.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
