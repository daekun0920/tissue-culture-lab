import { useQuery } from '@tanstack/react-query';
import { actionLogApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useLogs(params?: {
  containerQr?: string;
  action?: string;
  employeeId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: queryKeys.actionLogs.list(params),
    queryFn: () => actionLogApi.getAll(params),
  });
}
