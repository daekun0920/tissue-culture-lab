import { useState } from 'react';
import { Box, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  useContainerTypes,
  useCreateContainerType,
  useUpdateContainerType,
  useDeleteContainerType,
} from '@/hooks/use-container-types';
import type { ContainerType } from '@/types';
import { toast } from 'sonner';

const emptyForm = { name: '', size: '', material: '', isVented: false, isReusable: false };

export function ContainerTypeTab() {
  const { data: types, isLoading } = useContainerTypes();
  const createType = useCreateContainerType();
  const updateType = useUpdateContainerType();
  const deleteType = useDeleteContainerType();

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const [editing, setEditing] = useState<ContainerType | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);

  const [deleting, setDeleting] = useState<ContainerType | null>(null);

  const handleCreate = () => {
    if (!form.name.trim()) return;
    createType.mutate(
      {
        name: form.name.trim(),
        size: form.size.trim() || undefined,
        material: form.material.trim() || undefined,
        isVented: form.isVented,
        isReusable: form.isReusable,
      },
      {
        onSuccess: () => {
          toast.success('Container type created');
          setShowAdd(false);
          setForm(emptyForm);
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  const openEdit = (ct: ContainerType) => {
    setEditing(ct);
    setEditForm({
      name: ct.name,
      size: ct.size ?? '',
      material: ct.material ?? '',
      isVented: ct.isVented,
      isReusable: ct.isReusable,
    });
  };

  const handleUpdate = () => {
    if (!editing || !editForm.name.trim()) return;
    updateType.mutate(
      {
        id: editing.id,
        data: {
          name: editForm.name.trim(),
          size: editForm.size.trim() || null,
          material: editForm.material.trim() || null,
          isVented: editForm.isVented,
          isReusable: editForm.isReusable,
        },
      },
      {
        onSuccess: () => {
          toast.success('Container type updated');
          setEditing(null);
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  const handleDelete = () => {
    if (!deleting) return;
    deleteType.mutate(deleting.id, {
      onSuccess: () => {
        toast.success('Container type deleted');
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
      <div className="grid grid-cols-2 gap-3">
        <Input
          placeholder="Size (optional)"
          value={f.size}
          onChange={(e) => setF({ ...f, size: e.target.value })}
        />
        <Input
          placeholder="Material (optional)"
          value={f.material}
          onChange={(e) => setF({ ...f, material: e.target.value })}
        />
      </div>
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={f.isVented}
            onChange={(e) => setF({ ...f, isVented: e.target.checked })}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          Vented
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={f.isReusable}
            onChange={(e) => setF({ ...f, isReusable: e.target.checked })}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          Reusable
        </label>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      {types?.map((ct) => (
        <div
          key={ct.id}
          className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-violet-50">
            <Box className="h-5 w-5 text-violet-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium text-gray-900">{ct.name}</p>
              {ct.isVented && (
                <Badge className="bg-sky-100 text-sky-700">Vented</Badge>
              )}
              {ct.isReusable && (
                <Badge className="bg-teal-100 text-teal-700">Reusable</Badge>
              )}
            </div>
            <p className="text-sm text-gray-500">
              {[ct.size, ct.material].filter(Boolean).join(' · ') || 'No details'}
              {' · '}
              {ct._count?.containers ?? 0}{' '}
              {(ct._count?.containers ?? 0) === 1 ? 'container' : 'containers'}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="sm" onClick={() => openEdit(ct)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDeleting(ct)}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>
      ))}

      {types?.length === 0 && (
        <p className="py-8 text-center text-gray-400">
          No container types yet.
        </p>
      )}

      <button
        onClick={() => setShowAdd(true)}
        className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl p-4 text-gray-500 hover:border-violet-400 hover:text-violet-600 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Add Container Type
      </button>

      {/* Create dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Container Type</DialogTitle>
          </DialogHeader>
          {formFields(form, setForm)}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!form.name.trim() || createType.isPending}
            >
              {createType.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Container Type</DialogTitle>
          </DialogHeader>
          {formFields(editForm, setEditForm)}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={!editForm.name.trim() || updateType.isPending}
            >
              {updateType.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Container Type</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Are you sure you want to delete <strong>{deleting?.name}</strong>? This
            action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteType.isPending}
            >
              {deleteType.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
