import { PageHeader } from "@/components/common/page-header";
import { TestForm } from "@/components/tests/test-form";

export default function AdminNewTestPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Test"
        description="Define the assessment, then add questions"
      />
      <TestForm basePath="/admin/tests" />
    </div>
  );
}

