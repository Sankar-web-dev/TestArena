import { useQuery } from "@tanstack/react-query";
import { getQuestions } from "@/lib/api/questions";
import { queryKeys } from "@/lib/api/query-keys";

export function useQuestions(testId: number) {
  return useQuery({
    queryKey: queryKeys.testQuestions(testId),
    queryFn: () => getQuestions(testId),
    enabled: Number.isFinite(testId),
  });
}
