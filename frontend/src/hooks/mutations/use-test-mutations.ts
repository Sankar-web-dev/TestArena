import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createTest,
  deleteTest,
  publishTest,
  updateTest,
} from "@/lib/api/tests";
import {
  createQuestion,
  deleteQuestion,
  importQuestions,
  rejectQuestion,
  updateQuestion,
  verifyAllQuestions,
  verifyQuestion,
} from "@/lib/api/questions";
import type {
  CreateQuestionInput,
  CreateTestInput,
  UpdateQuestionInput,
  UpdateTestInput,
} from "@/lib/api/types";
import { queryKeys } from "@/lib/api/query-keys";

export function useCreateTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTestInput) =>
      createTest(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tests,
      });
    },
  });
}

export function useUpdateTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: {
      testId: number;
      input: UpdateTestInput;
    }) => updateTest(variables.testId, variables.input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tests,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.test(variables.testId),
      });
    },
  });
}

export function useDeleteTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (testId: number) => deleteTest(testId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tests,
      });
    },
  });
}

export function usePublishTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (testId: number) => publishTest(testId),
    onSuccess: (_data, testId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tests,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.test(testId),
      });
    },
  });
}

export function useCreateQuestion(testId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateQuestionInput) =>
      createQuestion(testId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.testQuestions(testId),
      });
    },
  });
}

export function useImportQuestions(testId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => importQuestions(testId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.testQuestions(testId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.tests,
      });
    },
  });
}

export function useUpdateQuestion(testId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: {
      questionId: number;
      input: UpdateQuestionInput;
    }) => updateQuestion(variables.questionId, variables.input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.testQuestions(testId),
      });
    },
  });
}

export function useDeleteQuestion(testId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (questionId: number) =>
      deleteQuestion(questionId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.testQuestions(testId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.tests,
      });
    },
  });
}

export function useVerifyAllQuestions(testId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => verifyAllQuestions(testId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.testQuestions(testId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.tests,
      });
    },
  });
}

export function useVerifyQuestion(testId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (questionId: number) =>
      verifyQuestion(questionId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.testQuestions(testId),
      });
    },
  });
}

export function useRejectQuestion(testId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (questionId: number) =>
      rejectQuestion(questionId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.testQuestions(testId),
      });
    },
  });
}
