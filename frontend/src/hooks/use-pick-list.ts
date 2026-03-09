import { useQuery } from '@tanstack/react-query';
import { pickListApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function usePickList(date?: string) {
  return useQuery({
    queryKey: queryKeys.pickList.list(date),
    queryFn: () => pickListApi.getPickList(date),
  });
}

export function usePickListSummary() {
  return useQuery({
    queryKey: queryKeys.pickList.summary,
    queryFn: pickListApi.getSummary,
  });
}
