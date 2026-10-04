import { ResultsIndex } from "@/components/tests/results-index";

export default function AdminReportsPage() {
  return <ResultsIndex testsBasePath="/admin/tests" mode="report" />;
}

