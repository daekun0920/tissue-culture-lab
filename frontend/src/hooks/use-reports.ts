import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useEmployeeReport(
  employeeId: string,
  from?: string,
  to?: string,
) {
  return useQuery({
    queryKey: queryKeys.reports.employee(employeeId, from, to),
    queryFn: () => reportsApi.getEmployeeReport(employeeId, from, to),
    enabled: !!employeeId,
  });
}

export function useSystemReport(from?: string, to?: string) {
  return useQuery({
    queryKey: queryKeys.reports.system(from, to),
    queryFn: () => reportsApi.getSystemReport(from, to),
  });
}

export function useEnhancedDashboard() {
  return useQuery({
    queryKey: queryKeys.enhancedDashboard,
    queryFn: reportsApi.getEnhancedDashboard,
  });
}
