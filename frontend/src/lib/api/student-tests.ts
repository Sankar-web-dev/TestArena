import { apiRequest } from "./client";
import type {
  AttemptQuestionsResponse,
  AvailableTest,
  EnterTestResponse,
  SaveAnswerResponse,
  SubmitAttemptResponse,
} from "./types";

// ---------- Student endpoints ----------

export function getAvailableTests() {
  return apiRequest<AvailableTest[]>("/api/student/tests");
}

export function enterTest(testId: number, password?: string) {
  return apiRequest<EnterTestResponse>(
    `/api/student/tests/${testId}/enter`,
    { method: "POST", body: { password } },
  );
}

export function getAttemptQuestions(attemptId: number) {
  return apiRequest<AttemptQuestionsResponse>(
    `/api/student/tests/attempts/${attemptId}`,
  );
}

export function saveAnswer(
  attemptId: number,
  questionId: number,
  selectedOption: string,
) {
  return apiRequest<SaveAnswerResponse>(
    `/api/student/tests/attempts/${attemptId}/questions/${questionId}/answer`,
    { method: "POST", body: { selectedOption } },
  );
}

export function submitAttempt(attemptId: number) {
  return apiRequest<SubmitAttemptResponse>(
    `/api/student/tests/attempts/${attemptId}/submit`,
    { method: "POST" },
  );
}
