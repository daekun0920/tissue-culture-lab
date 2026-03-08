import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { Employee } from '@/types';

export function useEmployees() {
  return useQuery({
    queryKey: queryKeys.employees.all,
    queryFn: employeeApi.getAll,
  });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string }) => employeeApi.create(data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.employees.all }),
  });
}

export function useUpdateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Employee> }) =>
      employeeApi.update(id, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.employees.all }),
  });
}

export function useDeleteEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => employeeApi.remove(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.employees.all }),
  });
}
