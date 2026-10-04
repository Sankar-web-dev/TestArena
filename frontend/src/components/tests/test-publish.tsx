"use client";

import Link from "next/link";
import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  ArrowLeftIcon,
  CalendarIcon,
  CheckCircle2Icon,
  CircleAlertIcon,
  ClockIcon,
  FileTextIcon,
  InfoIcon,
  ListChecksIcon,
  Loader2Icon,
  SendIcon,
} from "lucide-react";

import { useMyTests } from "@/hooks/queries/use-tests";
import { useQuestions } from "@/hooks/queries/use-questions";
import { usePublishTest } from "@/hooks/mutations/use-test-mutations";
import { ApiError } from "@/lib/api/client";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { EmptyState } from "@/components/common/empty-state";
import { LoadingState } from "@/components/common/loading-state";
import { ErrorState } from "@/components/common/error-state";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface PublishTestProps {
  basePath: string;
  testId: number;
}

const LIVE_STATUSES = new Set(["PUBLISHED", "LIVE", "ENDED"]);

export function PublishTest({ basePath, testId }: PublishTestProps) {
  const testsQuery = useMyTests();
  const {
    data: questions,
    isPending: questionsPending,
    isError: questionsError,
    error: questionsQueryError,
    refetch: refetchQuestions,
  } = useQuestions(testId);
  const publishMutation = usePublishTest();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justPublished, setJustPublished] = useState(false);

  const test = testsQuery.data?.find((t) => t.id === testId);

  if (testsQuery.isPending || questionsPending) {
    return <LoadingState rows={4} />;
  }

  if (questionsError) {
    return (
      <ErrorState
        error={questionsQueryError}
        onRetry={() => void refetchQuestions()}
      />
    );
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

  const allQuestions = questions ?? [];
  const verified = allQuestions.filter(
    (q) => q.status === "VERIFIED",
  ).length;
  const draft = allQuestions.filter(
    (q) => q.status === "DRAFT",
  ).length;
  const rejected = allQuestions.filter(
    (q) => q.status === "REJECTED",
  ).length;

  const hasQuestions = allQuestions.length > 0;
  const allVerified = hasQuestions && verified === allQuestions.length;
  const hasSchedule = !!test.startTime && !!test.endTime;
  const ready = hasQuestions && allVerified;

  const alreadyPublished = LIVE_STATUSES.has(test.status);

  const checklist = [
    {
      ok: hasQuestions,
      label: hasQuestions
        ? `${allQuestions.length} question${allQuestions.length === 1 ? "" : "s"} added`
        : "No questions yet",
      detail: hasQuestions
        ? `${verified} verified · ${draft} draft · ${rejected} rejected`
        : "Add at least one question before publishing",
    },
    {
      ok: allVerified,
      label: allVerified
        ? "All questions verified"
        : `${allQuestions.length - verified} question${allQuestions.length - verified === 1 ? "" : "s"} not verified`,
      detail: allVerified
        ? "Every question passed review"
        : "Verify or remove Draft/Rejected questions",
    },
    {
      ok: test.duration >= 1,
      label: `Duration configured`,
      detail: `${test.duration} minutes`,
    },
    {
      ok: hasSchedule,
      optional: true,
      label: hasSchedule
        ? "Schedule configured"
        : "No schedule set",
      detail: hasSchedule
        ? `${format(new Date(test.startTime!), "PPP p")} → ${format(new Date(test.endTime!), "PPP p")}`
        : "Optional — test stays open until ended",
    },
  ];

  async function handlePublish() {
    setError(null);
    try {
      await publishMutation.mutateAsync(test!.id);
      setJustPublished(true);
      toast.success(`"${test!.title}" published`, {
        description: "Students can now enter with the test password.",
      });
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Publish failed. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setConfirmOpen(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 mb-2 text-muted-foreground"
          render={<Link href={`${basePath}/${test.id}`} />}
        >
          <ArrowLeftIcon />
          Test details
        </Button>
        <PageHeader
          title={
            alreadyPublished || justPublished
              ? `"${test.title}" is live`
              : `Publish "${test.title}"`
          }
          description={
            alreadyPublished || justPublished
              ? "This test is open for student entry"
              : "Review the readiness checklist before going live"
          }
          actions={
            <StatusBadge
              status={justPublished ? "PUBLISHED" : test.status}
            />
          }
        />
      </div>

      {justPublished && (
        <Alert className="animate-fade-in-up border-success/40 bg-success/5 text-foreground">
          <CheckCircle2Icon className="text-success" />
          <AlertDescription>
            Test published successfully. Share the test password with
            students so they can enter.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <CircleAlertIcon />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!alreadyPublished && !justPublished && !ready && (
        <Alert>
          <InfoIcon />
          <AlertDescription>
            This test is not ready to publish. Resolve the checklist
            items below — the backend will reject the request
            otherwise.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Test summary */}
        <Card className="lg:col-span-2">
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <h2 className="font-heading text-base font-semibold">
                {test.title}
              </h2>
              {test.description && (
                <p className="text-sm text-muted-foreground">
                  {test.description}
                </p>
              )}
            </div>
            <Separator />
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <ClockIcon className="size-4" />
                Duration
              </div>
              <dd className="numeric font-medium">
                {test.duration} min
              </dd>
              <div className="flex items-center gap-2 text-muted-foreground">
                <ListChecksIcon className="size-4" />
                Questions
              </div>
              <dd className="numeric font-medium">
                {allQuestions.length}
              </dd>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarIcon className="size-4" />
                Starts
              </div>
              <dd className="numeric font-medium">
                {test.startTime
                  ? format(new Date(test.startTime), "MMM d, HH:mm")
                  : "—"}
              </dd>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarIcon className="size-4" />
                Ends
              </div>
              <dd className="numeric font-medium">
                {test.endTime
                  ? format(new Date(test.endTime), "MMM d, HH:mm")
                  : "—"}
              </dd>
            </dl>
          </CardContent>
        </Card>

        {/* Readiness checklist */}
        <Card
          className={cn(
            "lg:col-span-3 transition-shadow",
            ready && !alreadyPublished && !justPublished
              ? "border-electric/30 shadow-[0_0_24px_-8px_var(--electric)]"
              : "",
          )}
        >
          <CardContent className="space-y-1">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Readiness checklist
            </h3>
            {checklist.map((item) => (
              <div
                key={item.label}
                className="flex items-start gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-muted/40"
              >
                {item.ok ? (
                  <CheckCircle2Icon className="mt-0.5 size-5 shrink-0 text-success" />
                ) : item.optional ? (
                  <InfoIcon className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                ) : (
                  <CircleAlertIcon className="mt-0.5 size-5 shrink-0 text-warning" />
                )}
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.detail}
                  </p>
                </div>
              </div>
            ))}

            <Separator className="!my-4" />

            {alreadyPublished || justPublished ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Published — edit is locked while live.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  render={<Link href={`${basePath}/${test.id}`} />}
                >
                  View test
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  {ready
                    ? "All checks passed — ready to go live."
                    : "Complete the checklist to enable publishing."}
                </p>
                <Button
                  size="sm"
                  disabled={!ready || publishMutation.isPending}
                  onClick={() => setConfirmOpen(true)}
                  className="glow-electric bg-electric text-electric-foreground hover:bg-electric/90"
                >
                  {publishMutation.isPending ? (
                    <Loader2Icon className="animate-spin" />
                  ) : (
                    <SendIcon />
                  )}
                  Publish test
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Publish "${test.title}"?`}
        description="Students will be able to enter this test with its password. The backend re-validates all questions are verified."
        confirmLabel={
          publishMutation.isPending ? "Publishing…" : "Publish"
        }
        onConfirm={handlePublish}
      />
    </div>
  );
}
