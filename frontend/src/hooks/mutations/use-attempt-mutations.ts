import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  enterTest,
  saveAnswer,
  submitAttempt,
} from "@/lib/api/student-tests";
import { ApiError } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";

export function useEnterTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: {
      testId: number;
      password?: string;
    }) => enterTest(variables.testId, variables.password),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.studentTests,
      });
    },
  });
}

/**
 * Answer saving is a mutation only — we intentionally do NOT
 * invalidate the exam questions query after every save, to
 * avoid refetching the entire exam per keystroke. The local
 * exam state is the optimistic UI; the backend is the source
 * of truth on reload.
 *
 * Retries once on network/server failure, never on 4xx.
 */
export function useSaveAnswer() {
  return useMutation({
    mutationFn: (variables: {
      attemptId: number;
      questionId: number;
      selectedOption: string;
    }) =>
      saveAnswer(
        variables.attemptId,
        variables.questionId,
        variables.selectedOption,
      ),
    retry: (failureCount, error) => {
      if (
        error instanceof ApiError &&
        error.status >= 400 &&
        error.status < 500
      ) {
        return false;
      }
      return failureCount < 1;
    },
  });
}

export function useSubmitAttempt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (attemptId: number) =>
      submitAttempt(attemptId),
    onSuccess: (_data, attemptId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.attempt(attemptId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.studentTests,
      });
    },
  });
}
