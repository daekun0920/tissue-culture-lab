import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mediaBatchApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useMediaBatches() {
  return useQuery({
    queryKey: queryKeys.mediaBatches.all,
    queryFn: mediaBatchApi.getAll,
  });
}

export function useMediaBatchDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.mediaBatches.detail(id),
    queryFn: () => mediaBatchApi.getOne(id),
    enabled: !!id,
  });
}

export function useCreateMediaBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      recipeId: string;
      batchNumber?: string;
      notes?: string;
    }) => mediaBatchApi.create(data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.mediaBatches.all }),
  });
}

export function useDeleteMediaBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mediaBatchApi.remove(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.mediaBatches.all }),
  });
}
