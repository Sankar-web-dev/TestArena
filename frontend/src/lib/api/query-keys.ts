/**
 * Centralized TanStack Query keys.
 * Keep keys consistent so invalidation is predictable.
 */
export const queryKeys = {
  tests: ["tests"] as const,
  test: (testId: number) => ["tests", testId] as const,
  testQuestions: (testId: number) =>
    ["tests", testId, "questions"] as const,
  testResults: (testId: number) =>
    ["results", testId] as const,
  leaderboard: (testId: number) =>
    ["leaderboard", testId] as const,
  report: (testId: number) => ["reports", testId] as const,

  studentTests: ["student-tests"] as const,
  attempt: (attemptId: number) =>
    ["attempts", attemptId] as const,
  attemptQuestions: (attemptId: number) =>
    ["attempts", attemptId, "questions"] as const,

  adminStats: ["admin-stats"] as const,
  students: ["students"] as const,
  studentsList: (filters: object) =>
    ["students", "list", filters] as const,
  student: (id: string) => ["students", id] as const,
};
