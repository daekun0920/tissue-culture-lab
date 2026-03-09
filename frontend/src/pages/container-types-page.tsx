import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  useContainerTypes,
  useCreateContainerType,
  useUpdateContainerType,
  useDeleteContainerType,
} from '@/hooks/use-container-types';
import type { ContainerType } from '@/types';

export default function ContainerTypesPage() {
  const { data: types, isLoading, isError } = useContainerTypes();
  const createMutation = useCreateContainerType();
  const updateMutation = useUpdateContainerType();
  const deleteMutation = useDeleteContainerType();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ContainerType | null>(null);
  const [name, setName] = useState('');
  const [size, setSize] = useState('');
  const [material, setMaterial] = useState('');
  const [isVented, setIsVented] = useState(false);
  const [isReusable, setIsReusable] = useState(true);

  function openCreate() {
    setEditing(null);
    setName('');
    setSize('');
    setMaterial('');
    setIsVented(false);
    setIsReusable(true);
    setDialogOpen(true);
  }

  function openEdit(ct: ContainerType) {
    setEditing(ct);
    setName(ct.name);
    setSize(ct.size ?? '');
    setMaterial(ct.material ?? '');
    setIsVented(ct.isVented);
    setIsReusable(ct.isReusable);
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data: Partial<ContainerType> = {
      name,
      size: size || undefined,
      material: material || undefined,
      isVented,
      isReusable,
    };

    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, data });
        toast.success('Container type updated');
      } else {
        await createMutation.mutateAsync(data);
        toast.success('Container type created');
      }
      setDialogOpen(false);
    } catch {
      toast.error('Failed to save container type');
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Are you sure you want to delete this?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Container type deleted');
    } catch {
      toast.error('Failed to delete container type');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Container Types</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>New Container Type</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editing ? 'Edit Container Type' : 'New Container Type'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Glass Jar" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Size</Label>
                  <Input value={size} onChange={(e) => setSize(e.target.value)} placeholder="e.g. 500ml" />
                </div>
                <div className="space-y-2">
                  <Label>Material</Label>
                  <Input value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="e.g. glass" />
                </div>
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isVented} onChange={(e) => setIsVented(e.target.checked)} className="h-4 w-4 rounded" />
                  <span className="text-sm">Vented</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isReusable} onChange={(e) => setIsReusable(e.target.checked)} className="h-4 w-4 rounded" />
                  <span className="text-sm">Reusable</span>
                </label>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editing ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-gray-100">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-gray-700">All Container Types</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="py-8 text-center text-gray-400">Loading...</p>
          ) : isError ? (
            <p className="text-red-500">Failed to load data.</p>
          ) : !types?.length ? (
            <p className="py-8 text-center text-gray-400">No container types found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Properties</TableHead>
                  <TableHead>Containers</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {types.map((ct) => (
                  <TableRow key={ct.id}>
                    <TableCell className="font-medium">{ct.name}</TableCell>
                    <TableCell>{ct.size ?? '—'}</TableCell>
                    <TableCell>{ct.material ?? '—'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {ct.isVented && <Badge variant="outline" className="text-xs">Vented</Badge>}
                        {ct.isReusable && <Badge variant="outline" className="text-xs">Reusable</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>{ct._count?.containers ?? 0}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(ct)}>Edit</Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(ct.id)} disabled={deleteMutation.isPending}>Delete</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
