import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import {
  useMediaRecipes,
  useCreateMediaRecipe,
  useUpdateMediaRecipe,
  useDeleteMediaRecipe,
} from '@/hooks/use-media-recipes';
import type { MediaRecipe } from '@/types';

interface RecipeFormData {
  name: string;
  baseType: string;
  phLevel: string;
  agar: string;
  hormones: string;
}

const emptyForm: RecipeFormData = {
  name: '',
  baseType: '',
  phLevel: '',
  agar: '',
  hormones: '',
};

export default function MediaRecipesPage() {
  const { data: recipes, isLoading } = useMediaRecipes();
  const createMutation = useCreateMediaRecipe();
  const updateMutation = useUpdateMediaRecipe();
  const deleteMutation = useDeleteMediaRecipe();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<MediaRecipe | null>(null);
  const [form, setForm] = useState<RecipeFormData>(emptyForm);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  function openCreateDialog() {
    setEditingRecipe(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEditDialog(recipe: MediaRecipe) {
    setEditingRecipe(recipe);
    setForm({
      name: recipe.name,
      baseType: recipe.baseType,
      phLevel: String(recipe.phLevel),
      agar: String(recipe.agar),
      hormones: recipe.hormones,
    });
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const payload = {
      name: form.name,
      baseType: form.baseType,
      phLevel: parseFloat(form.phLevel),
      agar: parseFloat(form.agar),
      hormones: form.hormones,
    };

    try {
      if (editingRecipe) {
        await updateMutation.mutateAsync({ id: editingRecipe.id, data: payload });
        toast.success('Recipe updated successfully');
      } else {
        await createMutation.mutateAsync(payload);
        toast.success('Recipe created successfully');
      }
      setDialogOpen(false);
      setForm(emptyForm);
      setEditingRecipe(null);
    } catch {
      toast.error(editingRecipe ? 'Failed to update recipe' : 'Failed to create recipe');
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Recipe deleted successfully');
      setDeleteConfirmId(null);
    } catch {
      toast.error('Failed to delete recipe');
    }
  }

  function truncate(text: string, max: number) {
    if (text.length <= max) return text;
    return text.slice(0, max) + '...';
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Media Recipes</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>New Recipe</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingRecipe ? 'Edit Recipe' : 'New Recipe'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="baseType">Base Type</Label>
                <Input
                  id="baseType"
                  value={form.baseType}
                  onChange={(e) => setForm({ ...form, baseType: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phLevel">pH Level</Label>
                  <Input
                    id="phLevel"
                    type="number"
                    step="0.1"
                    value={form.phLevel}
                    onChange={(e) => setForm({ ...form, phLevel: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agar">Agar (g/L)</Label>
                  <Input
                    id="agar"
                    type="number"
                    step="0.1"
                    value={form.agar}
                    onChange={(e) => setForm({ ...form, agar: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hormones">Hormones (JSON)</Label>
                <Textarea
                  id="hormones"
                  placeholder='{"BAP": "5.00mg", "NAA": "0.50mg"}'
                  value={form.hormones}
                  onChange={(e) => setForm({ ...form, hormones: e.target.value })}
                  rows={3}
                />
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Saving...'
                    : editingRecipe
                      ? 'Update'
                      : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-gray-100">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-gray-700">
            All Recipes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="py-8 text-center text-gray-400">Loading recipes...</p>
          ) : !recipes?.length ? (
            <p className="py-8 text-center text-gray-400">
              No recipes found. Create your first recipe to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Base Type</TableHead>
                  <TableHead>pH</TableHead>
                  <TableHead>Agar (g/L)</TableHead>
                  <TableHead>Hormones</TableHead>
                  <TableHead>Batches</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recipes.map((recipe) => (
                  <TableRow key={recipe.id}>
                    <TableCell className="font-medium">{recipe.name}</TableCell>
                    <TableCell>{recipe.baseType}</TableCell>
                    <TableCell>{recipe.phLevel}</TableCell>
                    <TableCell>{recipe.agar}</TableCell>
                    <TableCell className="max-w-[200px]">
                      <span className="text-xs text-gray-500 font-mono">
                        {truncate(recipe.hormones || '-', 30)}
                      </span>
                    </TableCell>
                    <TableCell>{recipe._count?.batches ?? 0}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(recipe)}
                        >
                          Edit
                        </Button>

                        {deleteConfirmId === recipe.id ? (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(recipe.id)}
                              disabled={deleteMutation.isPending}
                            >
                              Confirm
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeleteConfirmId(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteConfirmId(recipe.id)}
                          >
                            Delete
                          </Button>
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
