"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  ArrowLeftIcon,
  BarChart3Icon,
  CalendarIcon,
  ClockIcon,
  FileTextIcon,
  ListChecksIcon,
  PencilIcon,
  SendIcon,
  Trash2Icon,
} from "lucide-react";

import { useMyTests } from "@/hooks/queries/use-tests";
import { useDeleteTest } from "@/hooks/mutations/use-test-mutations";
import { ApiError } from "@/lib/api/client";
import type { TestStatus } from "@/lib/api/types";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { EmptyState } from "@/components/common/empty-state";
import { LoadingState } from "@/components/common/loading-state";
import { ErrorState } from "@/components/common/error-state";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const CAN_EDIT = new Set<TestStatus>(["DRAFT", "READY", "PUBLISHED"]);
const CAN_PUBLISH = new Set<TestStatus>(["DRAFT", "READY"]);
const CAN_DELETE = new Set<TestStatus>(["DRAFT", "READY"]);

interface TestDetailProps {
  basePath: string;
  testId: number;
}

function formatDateTime(iso: string | null) {
  if (!iso) return "—";
  return format(new Date(iso), "PPP p");
}

export function TestDetail({ basePath, testId }: TestDetailProps) {
  const router = useRouter();
  const { data, isPending, isError, error, refetch } = useMyTests();
  const deleteMutation = useDeleteTest();

  const [confirmDelete, setConfirmDelete] = useState(false);

  const test = data?.find((t) => t.id === testId);

  if (isPending) {
    return <LoadingState rows={4} />;
  }

  if (isError) {
    return <ErrorState error={error} onRetry={() => void refetch()} />;
  }

  if (!test) {
    return (
      <EmptyState
        icon={<FileTextIcon />}
        title="Test not found"
        description="It may have been deleted or belongs to another account."
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

  async function handleDelete() {
    try {
      await deleteMutation.mutateAsync(test!.id);
      toast.success(`"${test!.title}" deleted`);
      router.push(basePath);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Delete failed",
      );
      setConfirmDelete(false);
    }
  }

  const meta = [
    {
      icon: <ClockIcon className="size-4" />,
      label: "Duration",
      value: `${test.duration} min`,
    },
    {
      icon: <ListChecksIcon className="size-4" />,
      label: "Questions",
      value: String(test._count?.questions ?? 0),
    },
    {
      icon: <CalendarIcon className="size-4" />,
      label: "Starts",
      value: formatDateTime(test.startTime),
    },
    {
      icon: <CalendarIcon className="size-4" />,
      label: "Ends",
      value: formatDateTime(test.endTime),
    },
  ];

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
          title={test.title}
          description={
            test.description ?? "No description provided"
          }
          actions={<StatusBadge status={test.status} />}
        />
      </div>

      <Card className="max-w-3xl">
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {meta.map((item) => (
              <div key={item.label} className="space-y-1">
                <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {item.icon}
                  {item.label}
                </p>
                <p className="numeric text-sm font-medium">{item.value}</p>
              </div>
            ))}
          </div>

          <Separator />

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              render={
                <Link href={`${basePath}/${test.id}/questions`} />
              }
            >
              <ListChecksIcon />
              Questions
            </Button>
            <Button
              size="sm"
              variant="outline"
              render={
                <Link href={`${basePath}/${test.id}/results`} />
              }
            >
              <BarChart3Icon />
              Results
            </Button>
            <Button
              size="sm"
              variant="outline"
              render={
                <Link href={`${basePath}/${test.id}/report`} />
              }
            >
              <FileTextIcon />
              Report
            </Button>
            {CAN_EDIT.has(test.status) && (
              <Button
                size="sm"
                variant="outline"
                render={
                  <Link href={`${basePath}/${test.id}/edit`} />
                }
              >
                <PencilIcon />
                Edit
              </Button>
            )}
            {CAN_PUBLISH.has(test.status) && (
              <Button
                size="sm"
                className="glow-electric bg-electric text-electric-foreground hover:bg-electric/90"
                render={
                  <Link href={`${basePath}/${test.id}/publish`} />
                }
              >
                <SendIcon />
                Publish
              </Button>
            )}
            {CAN_DELETE.has(test.status) && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2Icon />
                Delete
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete "${test.title}"?`}
        description="This permanently removes the test and all its questions. This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
