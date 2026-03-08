import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { experimentApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useExperiments(status?: string) {
  return useQuery({
    queryKey: [...queryKeys.experiments.all, status],
    queryFn: () => experimentApi.getAll(status),
  });
}

export function useExperimentDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.experiments.detail(id),
    queryFn: () => experimentApi.getOne(id),
    enabled: !!id,
  });
}

export function useCreateExperiment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string;
      description?: string;
      createdBy: string;
    }) => experimentApi.create(data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.experiments.all }),
  });
}

export function useUpdateExperiment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        name?: string;
        description?: string;
        status?: string;
        endDate?: string;
      };
    }) => experimentApi.update(id, data),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.experiments.all });
      qc.invalidateQueries({ queryKey: queryKeys.experiments.detail(id) });
    },
  });
}

export function useAddExperimentCultures() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { containerQrCodes: string[]; notes?: string };
    }) => experimentApi.addCultures(id, data),
    onSuccess: (_data, { id }) =>
      qc.invalidateQueries({ queryKey: queryKeys.experiments.detail(id) }),
  });
}

export function useRemoveExperimentCulture() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, containerQr }: { id: string; containerQr: string }) =>
      experimentApi.removeCulture(id, containerQr),
    onSuccess: (_data, { id }) =>
      qc.invalidateQueries({ queryKey: queryKeys.experiments.detail(id) }),
  });
}

export function useAddExperimentEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { entryType?: string; content: string; createdBy: string };
    }) => experimentApi.addEntry(id, data),
    onSuccess: (_data, { id }) =>
      qc.invalidateQueries({ queryKey: queryKeys.experiments.detail(id) }),
  });
}
