import { TestReport } from "@/components/tests/test-report";

export default async function AdminTestReportPage({
  params,
}: {
  params: Promise<{ testId: string }>;
}) {
  const { testId } = await params;

  return (
    <TestReport basePath="/admin/tests" testId={Number(testId)} />
  );
}
