import { QuestionsManager } from "@/components/tests/questions-manager";

export default async function AdminTestQuestionsPage({
  params,
}: {
  params: Promise<{ testId: string }>;
}) {
  const { testId } = await params;

  return (
    <QuestionsManager
      basePath="/admin/tests"
      testId={Number(testId)}
    />
  );
}
