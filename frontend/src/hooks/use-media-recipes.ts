import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mediaRecipeApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { MediaRecipe } from '@/types';

export function useMediaRecipes() {
  return useQuery({
    queryKey: queryKeys.mediaRecipes.all,
    queryFn: mediaRecipeApi.getAll,
  });
}

export function useMediaRecipeDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.mediaRecipes.detail(id),
    queryFn: () => mediaRecipeApi.getOne(id),
    enabled: !!id,
  });
}

export function useCreateMediaRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<MediaRecipe>) => mediaRecipeApi.create(data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.mediaRecipes.all }),
  });
}

export function useUpdateMediaRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MediaRecipe> }) =>
      mediaRecipeApi.update(id, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.mediaRecipes.all }),
  });
}

export function useDeleteMediaRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mediaRecipeApi.remove(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.mediaRecipes.all }),
  });
}
