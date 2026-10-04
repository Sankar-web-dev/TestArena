import { useQuery } from "@tanstack/react-query";
import {
  getMyTests,
  getLeaderboard,
  getTestReport,
  getTestResults,
} from "@/lib/api/tests";
import { queryKeys } from "@/lib/api/query-keys";

export function useMyTests() {
  return useQuery({
    queryKey: queryKeys.tests,
    queryFn: getMyTests,
  });
}

export function useTestResults(testId: number) {
  return useQuery({
    queryKey: queryKeys.testResults(testId),
    queryFn: () => getTestResults(testId),
    enabled: Number.isFinite(testId),
  });
}

export function useLeaderboard(testId: number) {
  return useQuery({
    queryKey: queryKeys.leaderboard(testId),
    queryFn: () => getLeaderboard(testId),
    enabled: Number.isFinite(testId),
  });
}

export function useTestReport(testId: number) {
  return useQuery({
    queryKey: queryKeys.report(testId),
    queryFn: () => getTestReport(testId),
    enabled: Number.isFinite(testId),
  });
}
