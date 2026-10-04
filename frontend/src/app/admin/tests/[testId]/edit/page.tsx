import { TestEdit } from "@/components/tests/test-edit";

export default async function AdminTestEditPage({
  params,
}: {
  params: Promise<{ testId: string }>;
}) {
  const { testId } = await params;

  return (
    <TestEdit basePath="/admin/tests" testId={Number(testId)} />
  );
}
