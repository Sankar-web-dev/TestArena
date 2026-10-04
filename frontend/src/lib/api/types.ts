/**
 * API types mirroring the NestJS backend responses.
 * Source: backend/src/tests/tests.service.ts return shapes.
 */

export type TestStatus =
  | "DRAFT"
  | "READY"
  | "PUBLISHED"
  | "LIVE"
  | "ENDED";

export type QuestionStatus = "DRAFT" | "VERIFIED" | "REJECTED";

export type AttemptStatus =
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "EXPIRED";

export type Role = "ADMIN" | "STUDENT";

// ---------- Admin: Tests ----------

export interface AdminTest {
  id: number;
  title: string;
  description: string | null;
  duration: number;
  status: TestStatus;
  startTime: string | null;
  endTime: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  _count?: { questions: number; attempts: number };
}

export interface CreateTestInput {
  title: string;
  description?: string;
  duration: number;
  password: string;
  /** ISO 8601 datetime strings; optional scheduled window */
  startTime?: string;
  endTime?: string;
}

export interface UpdateTestInput {
  title?: string;
  description?: string;
  duration?: number;
  /** Only sent when the user wants to rotate the test password */
  password?: string;
  /** ISO string to set, null to clear */
  startTime?: string | null;
  endTime?: string | null;
}

export interface DeleteTestResponse {
  message: string;
}

export interface CreateTestResponse {
  id: number;
  title: string;
  description: string | null;
  duration: number;
  status: TestStatus;
  createdById: string;
  createdAt: string;
}

export interface PublishTestResponse {
  id: number;
  title: string;
  description: string | null;
  duration: number;
  status: TestStatus;
  startTime: string | null;
  endTime: string | null;
  createdById: string;
  updatedAt: string;
}

// ---------- Admin: Questions ----------

export interface QuestionOption {
  id: number;
  questionId: number;
  optionKey: string;
  optionText: string;
}

export interface Question {
  id: number;
  testId: number;
  questionText: string;
  marks: number;
  status: QuestionStatus;
  correctOption: string | null;
  createdAt: string;
  updatedAt: string;
  options: QuestionOption[];
}

export interface QuestionOptionInput {
  optionKey: string;
  optionText: string;
}

export interface CreateQuestionInput {
  questionText: string;
  marks: number;
  correctOption: string;
  options: QuestionOptionInput[];
}

export type UpdateQuestionInput = Partial<CreateQuestionInput>;

export interface ImportQuestionsResponse {
  message: string;
  count: number;
  questions: Question[];
}

// ---------- Student: Tests ----------

export interface AvailableTest {
  id: number;
  title: string;
  description: string | null;
  duration: number;
  startTime: string | null;
  endTime: string | null;
  createdAt: string;
  /** The student's own attempt, if one exists. */
  attempt: { id: number; status: AttemptStatus } | null;
  _count?: { questions: number };
}

export interface EnterTestResponse {
  message: string;
  attemptId: number;
  startedAt: string;
  status?: AttemptStatus;
  duration?: number;
}

// ---------- Student: Attempt ----------

export interface AttemptQuestionOption {
  optionKey: string;
  optionText: string;
}

export interface AttemptQuestion {
  id: number;
  questionId: number;
  questionText: string;
  marks: number;
  /** Student's saved answer; null until answered. Never correctOption. */
  selectedOption: string | null;
  options: AttemptQuestionOption[];
}

export interface AttemptQuestionsResponse {
  attemptId: number;
  testId: number;
  startedAt: string;
  expiresAt: string;
  test: {
    title: string;
    description: string | null;
  };
  questions: AttemptQuestion[];
}

export interface SaveAnswerResponse {
  message: string;
}

export interface SubmitAttemptResponse {
  message: string;
}

// ---------- Admin: Results ----------

export interface TestResultEntry {
  id: number;
  score: number;
  totalMarks: number;
  percentage: number;
  createdAt: string;
  attempt: {
    id: number;
    startedAt: string;
    submittedAt: string | null;
    student: {
      id: string;
      name: string;
      email: string | null;
    };
  };
}

export interface TestResultsResponse {
  test: {
    id: number;
    title: string;
    duration: number;
  };
  totalStudents: number;
  results: TestResultEntry[];
}

export interface LeaderboardEntry {
  rank: number;
  student: {
    id: string;
    name: string;
  };
  score: number;
  totalMarks: number;
  percentage: number;
}

export interface TestReportResponse {
  test: {
    id: number;
    title: string;
    duration: number;
    status: TestStatus;
  };
  statistics: {
    totalStudents: number;
    submitted: number;
    expired: number;
    inProgress: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
  };
}

// ---------- Admin user management ----------

export type UserStatus = "ACTIVE" | "INACTIVE";

export interface ManagedUser {
  id: string;
  name: string;
  username: string | null;
  email: string;
  role: "ADMIN" | "STUDENT";
  status: UserStatus;
  createdAt: string;
  _count?: { attempts?: number; createdTests?: number };
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ManagedUserListResponse {
  data: ManagedUser[];
  pagination: Pagination;
}

export interface CreateStudentInput {
  name: string;
  email: string;
}

export interface UpdateUserInput {
  name?: string;
  username?: string;
  email?: string;
}

export interface StudentDetail extends ManagedUser {
  stats: {
    attemptCount: number;
    submittedCount: number;
    averagePercentage: number | null;
  };
  recentAttempts: {
    id: number;
    status: AttemptStatus;
    startedAt: string;
    submittedAt: string | null;
    test: { id: number; title: string };
    result: {
      score: number;
      totalMarks: number;
      percentage: number;
    } | null;
  }[];
}

export interface AdminDashboardStats {
  tests: {
    total: number;
    published: number;
    drafts: number;
  };
  questions: number;
  students: number;
}

export interface ImportStudentsPreview {
  totalRows: number;
  valid: number;
  invalid: number;
  rows: {
    row: number;
    name: string;
    email: string;
    valid: boolean;
    message: string;
  }[];
}

export interface ImportStudentsResult {
  totalRows: number;
  created: number;
  failed: number;
  errors: {
    row: number;
    field: string;
    message: string;
  }[];
}
