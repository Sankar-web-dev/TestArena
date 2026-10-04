import { TestDetail } from "@/components/tests/test-detail";

export default async function AdminTestDetailPage({
  params,
}: {
  params: Promise<{ testId: string }>;
}) {
  const { testId } = await params;

  return (
    <TestDetail basePath="/admin/tests" testId={Number(testId)} />
  );
}
