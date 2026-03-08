import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { containerApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { BatchActionPayload } from '@/types';

export function useContainers(status?: string) {
  return useQuery({
    queryKey: [...queryKeys.containers.all, status],
    queryFn: () => containerApi.getAll(status),
  });
}

export function useContainerDetail(qr: string) {
  return useQuery({
    queryKey: queryKeys.containers.detail(qr),
    queryFn: () => containerApi.getByQr(qr),
    enabled: !!qr,
  });
}

export function useContainerLookup(q: string) {
  return useQuery({
    queryKey: queryKeys.containers.lookup(q),
    queryFn: () => containerApi.lookup(q),
    enabled: q.length >= 2,
  });
}

export function useBatchAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: BatchActionPayload) =>
      containerApi.batchAction(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.containers.all, exact: false });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useRegisterContainers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { qrCodes: string[]; containerTypeId?: string; notes?: string }) =>
      containerApi.register(args.qrCodes, args.containerTypeId, args.notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.containers.all, exact: false });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useValidateAction(action: string, qrCodes: string[]) {
  return useQuery({
    queryKey: ['validate-action', action, ...qrCodes],
    queryFn: () => containerApi.validateAction(action, qrCodes),
    enabled: !!action && qrCodes.length > 0,
  });
}

export function useDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: () => containerApi.getDashboard(),
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
}
