import { apiRequest, API_URL } from "./client";
import type {
  AdminTest,
  CreateTestInput,
  CreateTestResponse,
  DeleteTestResponse,
  LeaderboardEntry,
  PublishTestResponse,
  TestReportResponse,
  TestResultsResponse,
  UpdateTestInput,
} from "./types";

// ---------- Admin test endpoints ----------

export function getMyTests() {
  return apiRequest<AdminTest[]>("/api/tests");
}

export function createTest(input: CreateTestInput) {
  return apiRequest<CreateTestResponse>("/api/tests", {
    method: "POST",
    body: input,
  });
}

export function updateTest(
  testId: number,
  input: UpdateTestInput,
) {
  return apiRequest<AdminTest>(`/api/tests/${testId}`, {
    method: "PUT",
    body: input,
  });
}

export function deleteTest(testId: number) {
  return apiRequest<DeleteTestResponse>(`/api/tests/${testId}`, {
    method: "DELETE",
  });
}

export function publishTest(testId: number) {
  return apiRequest<PublishTestResponse>(
    `/api/tests/${testId}/publish`,
    { method: "PUT" },
  );
}

export function getTestResults(testId: number) {
  return apiRequest<TestResultsResponse>(
    `/api/tests/${testId}/results`,
  );
}

export function getLeaderboard(testId: number) {
  return apiRequest<LeaderboardEntry[]>(
    `/api/tests/${testId}/leaderboard`,
  );
}

export function getTestReport(testId: number) {
  return apiRequest<TestReportResponse>(
    `/api/tests/${testId}/report`,
  );
}

/** Returns a URL for the CSV export (browser download). */
export function getExportUrl(testId: number) {
  return `${API_URL}/api/tests/${testId}/results/export`;
}
