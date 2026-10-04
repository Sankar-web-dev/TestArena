import { TestResults } from "@/components/tests/test-results";

export default async function AdminTestResultsPage({
  params,
}: {
  params: Promise<{ testId: string }>;
}) {
  const { testId } = await params;

  return (
    <TestResults
      basePath="/admin/tests"
      testId={Number(testId)}
    />
  );
}
