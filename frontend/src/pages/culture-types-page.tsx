import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from '@/components/ui/table';
import {
  useCultureTypes, useCreateCultureType, useUpdateCultureType, useDeleteCultureType,
} from '@/hooks/use-culture-types';
import type { CultureType } from '@/types';

export default function CultureTypesPage() {
  const { data: cultureTypes, isLoading } = useCultureTypes();
  const createMutation = useCreateCultureType();
  const updateMutation = useUpdateCultureType();
  const deleteMutation = useDeleteCultureType();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<CultureType | null>(null);
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [clone, setClone] = useState('');
  const [origin, setOrigin] = useState('');
  const [interval, setInterval] = useState('28');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  function openCreateDialog() {
    setEditingType(null);
    setName('');
    setSpecies('');
    setClone('');
    setOrigin('');
    setInterval('28');
    setDialogOpen(true);
  }

  function openEditDialog(ct: CultureType) {
    setEditingType(ct);
    setName(ct.name);
    setSpecies(ct.species ?? '');
    setClone(ct.clone ?? '');
    setOrigin(ct.origin ?? '');
    setInterval(String(ct.defaultSubcultureInterval ?? 28));
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data: Partial<CultureType> = {
      name,
      species: species || undefined,
      clone: clone || undefined,
      origin: origin || undefined,
      defaultSubcultureInterval: parseInt(interval) || 28,
    };

    try {
      if (editingType) {
        await updateMutation.mutateAsync({ id: editingType.id, data });
        toast.success('Culture type updated successfully');
      } else {
        await createMutation.mutateAsync(data);
        toast.success('Culture type created successfully');
      }
      setDialogOpen(false);
    } catch {
      toast.error('Failed to save culture type');
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Culture type deleted successfully');
      setDeleteConfirmId(null);
    } catch {
      toast.error('Failed to delete culture type');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Culture Types</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>New Culture Type</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingType ? 'Edit Culture Type' : 'New Culture Type'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Orchid Protocorm" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Species</Label>
                  <Input value={species} onChange={(e) => setSpecies(e.target.value)} placeholder="e.g. Monstera deliciosa" />
                </div>
                <div className="space-y-2">
                  <Label>Clone</Label>
                  <Input value={clone} onChange={(e) => setClone(e.target.value)} placeholder="Clone identifier" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Origin</Label>
                  <Input value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="Source/origin" />
                </div>
                <div className="space-y-2">
                  <Label>Subculture Interval (days)</Label>
                  <Input type="number" value={interval} onChange={(e) => setInterval(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingType ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-gray-100">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-gray-700">All Culture Types</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="py-8 text-center text-gray-400">Loading culture types...</p>
          ) : !cultureTypes?.length ? (
            <p className="py-8 text-center text-gray-400">No culture types found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Species</TableHead>
                  <TableHead>Interval</TableHead>
                  <TableHead>Containers</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cultureTypes.map((ct) => (
                  <TableRow key={ct.id}>
                    <TableCell className="font-medium">{ct.name}</TableCell>
                    <TableCell className="text-sm text-gray-500">{ct.species ?? '—'}</TableCell>
                    <TableCell>{ct.defaultSubcultureInterval}d</TableCell>
                    <TableCell>{ct._count?.containers ?? 0}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(ct)}>Edit</Button>
                        {deleteConfirmId === ct.id ? (
                          <div className="flex items-center gap-1">
                            <Button variant="destructive" size="sm" onClick={() => handleDelete(ct.id)} disabled={deleteMutation.isPending}>Confirm</Button>
                            <Button variant="outline" size="sm" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
                          </div>
                        ) : (
                          <Button variant="outline" size="sm" onClick={() => setDeleteConfirmId(ct.id)}>Delete</Button>
                        )}
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
