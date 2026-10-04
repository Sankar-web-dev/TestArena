import { useQuery } from "@tanstack/react-query";
import {
  getAttemptQuestions,
  getAvailableTests,
} from "@/lib/api/student-tests";
import { queryKeys } from "@/lib/api/query-keys";

export function useAvailableTests() {
  return useQuery({
    queryKey: queryKeys.studentTests,
    queryFn: getAvailableTests,
  });
}

export function useAttemptQuestions(attemptId: number) {
  return useQuery({
    queryKey: queryKeys.attemptQuestions(attemptId),
    queryFn: () => getAttemptQuestions(attemptId),
    enabled: Number.isFinite(attemptId),
    // Exam questions rarely change mid-attempt; avoid refetches.
    staleTime: 5 * 60_000,
  });
}
