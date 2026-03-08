import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cultureTypeApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { CultureType } from '@/types';

export function useCultureTypes() {
  return useQuery({
    queryKey: queryKeys.cultureTypes.all,
    queryFn: cultureTypeApi.getAll,
  });
}

export function useCreateCultureType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CultureType>) => cultureTypeApi.create(data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.cultureTypes.all }),
  });
}

export function useUpdateCultureType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CultureType>;
    }) => cultureTypeApi.update(id, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.cultureTypes.all }),
  });
}

export function useDeleteCultureType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cultureTypeApi.remove(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.cultureTypes.all }),
  });
}
