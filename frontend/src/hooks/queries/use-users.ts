import { useQuery } from "@tanstack/react-query";
import {
  getAdminStats,
  getStudent,
  getStudents,
  type ListUsersParams,
} from "@/lib/api/users";
import { queryKeys } from "@/lib/api/query-keys";

export function useAdminStats() {
  return useQuery({
    queryKey: queryKeys.adminStats,
    queryFn: getAdminStats,
  });
}

export function useStudents(params: ListUsersParams = {}) {
  return useQuery({
    queryKey: queryKeys.studentsList(params),
    queryFn: () => getStudents(params),
  });
}

export function useStudent(id: string) {
  return useQuery({
    queryKey: queryKeys.student(id),
    queryFn: () => getStudent(id),
    enabled: !!id,
  });
}
