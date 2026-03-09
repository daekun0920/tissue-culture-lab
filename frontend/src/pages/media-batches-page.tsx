import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from '@/components/ui/table';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useMediaBatches, useCreateMediaBatch, useDeleteMediaBatch } from '@/hooks/use-media-batches';
import { useMediaRecipes } from '@/hooks/use-media-recipes';

export default function MediaBatchesPage() {
  const { data: batches, isLoading, isError } = useMediaBatches();
  const { data: recipes } = useMediaRecipes();
  const createMutation = useCreateMediaBatch();
  const deleteMutation = useDeleteMediaBatch();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRecipeId, setSelectedRecipeId] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [expandedBatchId, setExpandedBatchId] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedRecipeId) { toast.error('Please select a recipe'); return; }
    try {
      await createMutation.mutateAsync({
        recipeId: selectedRecipeId,
        batchNumber: batchNumber || undefined,
        notes: notes || undefined,
      });
      toast.success('Batch created');
      setDialogOpen(false);
      setSelectedRecipeId('');
      setBatchNumber('');
      setNotes('');
    } catch { toast.error('Failed to create batch'); }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Are you sure you want to delete this?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Batch deleted');
    } catch { toast.error('Failed to delete batch'); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Media Batches</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button>New Batch</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Batch</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Recipe</Label>
                <Select value={selectedRecipeId} onValueChange={setSelectedRecipeId}>
                  <SelectTrigger><SelectValue placeholder="Select a recipe" /></SelectTrigger>
                  <SelectContent>
                    {recipes?.map((r) => (
                      <SelectItem key={r.id} value={r.id}>{r.name} ({r.baseType})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Batch Number</Label>
                <Input value={batchNumber} onChange={(e) => setBatchNumber(e.target.value)} placeholder="e.g. MB-003" />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" rows={2} />
              </div>
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? 'Creating...' : 'Create'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-gray-100">
        <CardHeader><CardTitle className="text-lg font-medium text-gray-700">All Batches</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="py-8 text-center text-gray-400">Loading...</p>
          ) : isError ? (
            <p className="text-red-500">Failed to load data.</p>
          ) : !batches?.length ? (
            <p className="py-8 text-center text-gray-400">No batches found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch #</TableHead>
                  <TableHead>Recipe</TableHead>
                  <TableHead>Prep Date</TableHead>
                  <TableHead>Containers</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((batch) => (
                  <TableRow key={batch.id} className="cursor-pointer" onClick={() => setExpandedBatchId(p => p === batch.id ? null : batch.id)}>
                    <TableCell className="font-mono text-sm">{batch.batchNumber ?? '—'}</TableCell>
                    <TableCell className="font-medium">{batch.recipe?.name ?? 'Unknown'}</TableCell>
                    <TableCell>{new Date(batch.datePrep).toLocaleDateString()}</TableCell>
                    <TableCell>{batch._count?.containers ?? 0}</TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(batch.id)} disabled={deleteMutation.isPending}>Delete</Button>
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
