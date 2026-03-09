import { useQuery } from '@tanstack/react-query';
import { qrManagerApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useQrSummary() {
  return useQuery({
    queryKey: queryKeys.qrManager.summary,
    queryFn: qrManagerApi.getSummary,
  });
}
