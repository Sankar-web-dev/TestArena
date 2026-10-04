import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createStudent,
  importStudents,
  resetStudentPassword,
  updateStudent,
  updateStudentStatus,
} from "@/lib/api/users";
import type {
  CreateStudentInput,
  UpdateUserInput,
  UserStatus,
} from "@/lib/api/types";
import { queryKeys } from "@/lib/api/query-keys";

// ---------- students ----------

export function useCreateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateStudentInput) =>
      createStudent(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.students,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.adminStats,
      });
    },
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: {
      id: string;
      input: UpdateUserInput;
    }) => updateStudent(variables.id, variables.input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.students,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.student(variables.id),
      });
    },
  });
}

export function useUpdateStudentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: {
      id: string;
      status: UserStatus;
    }) => updateStudentStatus(variables.id, variables.status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.students,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.student(variables.id),
      });
    },
  });
}

export function useResetStudentPassword() {
  return useMutation({
    mutationFn: (variables: { id: string; password: string }) =>
      resetStudentPassword(variables.id, variables.password),
  });
}

export function useImportStudents() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: {
      file: File;
      dryRun: boolean;
    }) => importStudents(variables.file, variables.dryRun),
    onSuccess: (_data, variables) => {
      // Only the real import changes data.
      if (!variables.dryRun) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.students,
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.adminStats,
        });
      }
    },
  });
}
