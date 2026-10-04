import { ExamEngine } from "@/components/student/exam-engine";

export default async function StudentAttemptPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;

  return <ExamEngine attemptId={Number(attemptId)} />;
}

