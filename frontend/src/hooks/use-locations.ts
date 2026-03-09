import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { locationApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useZones() {
  return useQuery({
    queryKey: queryKeys.locations.zones,
    queryFn: locationApi.getZones,
  });
}

export function useZoneDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.locations.zone(id),
    queryFn: () => locationApi.getZone(id),
    enabled: !!id,
  });
}

export function useRackDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.locations.rack(id),
    queryFn: () => locationApi.getRack(id),
    enabled: !!id,
  });
}

export function useCreateZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string }) => locationApi.createZone(data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.locations.zones }),
  });
}

export function useUpdateZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string } }) =>
      locationApi.updateZone(id, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.locations.zones }),
  });
}

export function useDeleteZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => locationApi.deleteZone(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.locations.zones }),
  });
}

export function useCreateRack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; zoneId: string }) =>
      locationApi.createRack(data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.locations.zones });
      qc.invalidateQueries({
        queryKey: queryKeys.locations.zone(variables.zoneId),
      });
    },
  });
}

export function useUpdateRack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string } }) =>
      locationApi.updateRack(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.locations.zones });
    },
  });
}

export function useDeleteRack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => locationApi.deleteRack(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.locations.zones });
    },
  });
}

export function useCreateShelf() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; rackId: string }) =>
      locationApi.createShelf(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.locations.zones });
    },
  });
}

export function useUpdateShelf() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string } }) =>
      locationApi.updateShelf(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.locations.zones });
    },
  });
}

export function useDeleteShelf() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => locationApi.deleteShelf(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.locations.zones });
    },
  });
}
