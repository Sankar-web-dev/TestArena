"use client";

import Link from "next/link";
import { ArrowLeftIcon, FileTextIcon } from "lucide-react";

import { useMyTests } from "@/hooks/queries/use-tests";
import type { TestStatus } from "@/lib/api/types";
import { EmptyState } from "@/components/common/empty-state";
import { LoadingState } from "@/components/common/loading-state";
import { ErrorState } from "@/components/common/error-state";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { TestForm } from "./test-form";

const CAN_EDIT = new Set<TestStatus>(["DRAFT", "READY", "PUBLISHED"]);

interface TestEditProps {
  basePath: string;
  testId: number;
}

export function TestEdit({ basePath, testId }: TestEditProps) {
  const { data, isPending, isError, error, refetch } = useMyTests();

  const test = data?.find((t) => t.id === testId);

  if (isPending) {
    return <LoadingState rows={4} />;
  }

  if (isError) {
    return <ErrorState error={error} onRetry={() => void refetch()} />;
  }

  if (!test || !CAN_EDIT.has(test.status)) {
    return (
      <EmptyState
        icon={<FileTextIcon />}
        title={test ? "This test can no longer be edited" : "Test not found"}
        description={
          test
            ? "Live and ended tests are read-only."
            : "It may have been deleted or belongs to another account."
        }
        action={
          <Button
            variant="outline"
            size="sm"
            render={<Link href={basePath} />}
          >
            <ArrowLeftIcon />
            Back to tests
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 mb-2 text-muted-foreground"
          render={<Link href={basePath} />}
        >
          <ArrowLeftIcon />
          All tests
        </Button>
        <PageHeader
          title={`Edit "${test.title}"`}
          description="Update the test details below"
        />
      </div>
      <TestForm basePath={basePath} initialTest={test} />
    </div>
  );
}
