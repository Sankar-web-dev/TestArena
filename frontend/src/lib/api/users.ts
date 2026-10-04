import { apiRequest, API_URL, ApiError } from "./client";
import type {
  AdminDashboardStats,
  CreateStudentInput,
  ImportStudentsPreview,
  ImportStudentsResult,
  ManagedUserListResponse,
  StudentDetail,
  UpdateUserInput,
  UserStatus,
} from "./types";

export interface ListUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: UserStatus;
}

function userQuery(params: ListUsersParams = {}) {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  if (params.search) search.set("search", params.search);
  if (params.status) search.set("status", params.status);
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

// ---------- dashboard ----------

export function getAdminStats() {
  return apiRequest<AdminDashboardStats>(
    "/api/admin/dashboard/stats",
  );
}

// ---------- students ----------

export function getStudents(params: ListUsersParams = {}) {
  return apiRequest<ManagedUserListResponse>(
    `/api/admin/students${userQuery(params)}`,
  );
}

export function getStudent(id: string) {
  return apiRequest<StudentDetail>(`/api/admin/students/${id}`);
}

export function createStudent(input: CreateStudentInput) {
  return apiRequest<unknown>("/api/admin/students", {
    method: "POST",
    body: input,
  });
}

export function updateStudent(id: string, input: UpdateUserInput) {
  return apiRequest<unknown>(`/api/admin/students/${id}`, {
    method: "PATCH",
    body: input,
  });
}

export function updateStudentStatus(id: string, status: UserStatus) {
  return apiRequest<unknown>(`/api/admin/students/${id}/status`, {
    method: "PATCH",
    body: { status },
  });
}

export function resetStudentPassword(id: string, password: string) {
  return apiRequest<{ message: string }>(
    `/api/admin/students/${id}/reset-password`,
    { method: "POST", body: { password } },
  );
}

/**
 * Multipart upload — dryRun validates the file server-side
 * without creating accounts; the second call performs the
 * actual import.
 */
export async function importStudents<T extends boolean>(
  file: File,
  dryRun: T,
): Promise<T extends true ? ImportStudentsPreview : ImportStudentsResult> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    `${API_URL}/api/admin/students/import${dryRun ? "?dryRun=true" : ""}`,
    {
      method: "POST",
      credentials: "include",
      body: formData,
    },
  );

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as {
      message?: string | string[];
    };
    const message = Array.isArray(data.message)
      ? data.message.join(", ")
      : data.message;
    throw new ApiError(
      response.status,
      message ?? `Import failed with status ${response.status}`,
    );
  }

  return response.json();
}

export const STUDENT_IMPORT_TEMPLATE_URL = `${API_URL}/api/admin/students/import-template`;
