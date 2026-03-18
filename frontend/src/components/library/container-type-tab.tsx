import { useState } from 'react';
import { Box, Plus } from 'lucide-react';
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
} from '@/hooks/use-container-types';
import { toast } from 'sonner';

export function ContainerTypeTab() {
  const { data: types, isLoading } = useContainerTypes();
  const createType = useCreateContainerType();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: '',
    size: '',
    material: '',
    isVented: false,
    isReusable: false,
  });

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
          setForm({ name: '', size: '', material: '', isVented: false, isReusable: false });
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

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Container Type</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Size (optional)"
                value={form.size}
                onChange={(e) => setForm({ ...form, size: e.target.value })}
              />
              <Input
                placeholder="Material (optional)"
                value={form.material}
                onChange={(e) => setForm({ ...form, material: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isVented}
                  onChange={(e) =>
                    setForm({ ...form, isVented: e.target.checked })
                  }
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                Vented
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isReusable}
                  onChange={(e) =>
                    setForm({ ...form, isReusable: e.target.checked })
                  }
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                Reusable
              </label>
            </div>
          </div>
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
    </div>
  );
}
