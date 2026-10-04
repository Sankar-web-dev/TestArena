import { PublishTest } from "@/components/tests/test-publish";

export default async function AdminTestPublishPage({
  params,
}: {
  params: Promise<{ testId: string }>;
}) {
  const { testId } = await params;

  return (
    <PublishTest basePath="/admin/tests" testId={Number(testId)} />
  );
}
