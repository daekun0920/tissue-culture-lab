import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { containerTypeApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { ContainerType } from '@/types';

export function useContainerTypes() {
  return useQuery({
    queryKey: queryKeys.containerTypes.all,
    queryFn: containerTypeApi.getAll,
  });
}

export function useCreateContainerType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ContainerType>) =>
      containerTypeApi.create(data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.containerTypes.all }),
  });
}

export function useUpdateContainerType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ContainerType> }) =>
      containerTypeApi.update(id, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.containerTypes.all }),
  });
}

export function useDeleteContainerType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => containerTypeApi.remove(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.containerTypes.all }),
  });
}
