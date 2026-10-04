import { apiRequest, API_URL } from "./client";
import type {
  CreateQuestionInput,
  ImportQuestionsResponse,
  Question,
  UpdateQuestionInput,
} from "./types";

// ---------- Admin question endpoints ----------

export function getQuestions(testId: number) {
  return apiRequest<Question[]>(
    `/api/tests/${testId}/questions`,
  );
}

export function createQuestion(
  testId: number,
  input: CreateQuestionInput,
) {
  return apiRequest<Question>(
    `/api/tests/${testId}/questions`,
    { method: "POST", body: input },
  );
}

export async function importQuestions(
  testId: number,
  file: File,
): Promise<ImportQuestionsResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    `${API_URL}/api/tests/${testId}/questions/import`,
    {
      method: "POST",
      credentials: "include",
      body: formData,
    },
  );

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as {
      message?: string;
    };
    throw new Error(
      data.message ??
        `Import failed with status ${response.status}`,
    );
  }

  return response.json() as Promise<ImportQuestionsResponse>;
}

export function updateQuestion(
  questionId: number,
  input: UpdateQuestionInput,
) {
  return apiRequest<Question>(
    `/api/tests/questions/${questionId}`,
    { method: "PATCH", body: input },
  );
}

export function deleteQuestion(questionId: number) {
  return apiRequest<{ message: string }>(
    `/api/tests/questions/${questionId}`,
    { method: "DELETE" },
  );
}

export function verifyAllQuestions(testId: number) {
  return apiRequest<{ message: string; count: number }>(
    `/api/tests/${testId}/questions/verify-all`,
    { method: "PUT" },
  );
}

export function verifyQuestion(questionId: number) {
  return apiRequest<Question>(
    `/api/tests/questions/${questionId}/verify`,
    { method: "PUT" },
  );
}

export function rejectQuestion(questionId: number) {
  return apiRequest<Question>(
    `/api/tests/questions/${questionId}/reject`,
    { method: "PUT" },
  );
}
