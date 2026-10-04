"use client";

import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowLeftIcon,
  BarChart3Icon,
  CalendarIcon,
  CheckCircle2Icon,
  ClockIcon,
  FileTextIcon,
  ListChecksIcon,
  Loader2Icon,
  TrendingDownIcon,
  TrendingUpIcon,
  UsersIcon,
  XCircleIcon,
} from "lucide-react";

import { useMyTests } from "@/hooks/queries/use-tests";
import {
  useTestReport,
  useTestResults,
} from "@/hooks/queries/use-tests";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { EmptyState } from "@/components/common/empty-state";
import { LoadingState } from "@/components/common/loading-state";
import { ErrorState } from "@/components/common/error-state";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface TestReportProps {
  basePath: string;
  testId: number;
}

const BUCKETS = [
  { label: "0–20", min: 0, max: 20 },
  { label: "20–40", min: 20, max: 40 },
  { label: "40–60", min: 40, max: 60 },
  { label: "60–80", min: 60, max: 80 },
  { label: "80–100", min: 80, max: 100.0001 },
];

export function TestReport({ basePath, testId }: TestReportProps) {
  const testsQuery = useMyTests();
  const reportQuery = useTestReport(testId);
  const resultsQuery = useTestResults(testId);

  const test = testsQuery.data?.find((t) => t.id === testId);

  const isPending =
    reportQuery.isPending || testsQuery.isPending;

  if (isPending) {
    return <LoadingState rows={5} />;
  }

  if (reportQuery.isError || testsQuery.isError) {
    return (
      <ErrorState
        error={reportQuery.error ?? testsQuery.error}
        onRetry={() => {
          void reportQuery.refetch();
          void testsQuery.refetch();
        }}
      />
    );
  }

  const report = reportQuery.data;
  if (!report || !test) {
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

  const { statistics: s } = report;
  const hasSubmissions = s.submitted > 0;

  // Completion segments — real backend counts
  const segments = [
    {
      label: "Submitted",
      count: s.submitted,
      className: "bg-success",
      textClass: "text-success",
    },
    {
      label: "Expired",
      count: s.expired,
      className: "bg-warning",
      textClass: "text-warning",
    },
    {
      label: "In progress",
      count: s.inProgress,
      className: "bg-electric",
      textClass: "text-electric",
    },
  ];

  // Score distribution — real per-student percentages from results
  const percentages = (resultsQuery.data?.results ?? []).map(
    (r) => r.percentage,
  );
  const distribution = BUCKETS.map((bucket) => ({
    ...bucket,
    count: percentages.filter(
      (p) => p >= bucket.min && p < bucket.max,
    ).length,
  }));
  const maxBucket = Math.max(1, ...distribution.map((d) => d.count));

  const metrics = [
    {
      label: "Total Students",
      value: s.totalStudents,
      icon: <UsersIcon className="size-4" />,
    },
    {
      label: "Submitted",
      value: s.submitted,
      icon: <CheckCircle2Icon className="size-4" />,
      tone: "text-success",
    },
    {
      label: "Expired",
      value: s.expired,
      icon: <XCircleIcon className="size-4" />,
      tone: "text-warning",
    },
    {
      label: "In Progress",
      value: s.inProgress,
      icon: <Loader2Icon className="size-4" />,
      tone: "text-electric",
    },
  ];

  const scoreMetrics = [
    {
      label: "Average Score",
      value: hasSubmissions
        ? `${s.averageScore.toFixed(1)}%`
        : "—",
    },
    {
      label: "Highest Score",
      value: hasSubmissions
        ? `${s.highestScore.toFixed(1)}%`
        : "—",
      icon: <TrendingUpIcon className="size-4 text-success" />,
    },
    {
      label: "Lowest Score",
      value: hasSubmissions
        ? `${s.lowestScore.toFixed(1)}%`
        : "—",
      icon: <TrendingDownIcon className="size-4 text-destructive" />,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 mb-2 text-muted-foreground"
          render={<Link href={`${basePath}/${testId}`} />}
        >
          <ArrowLeftIcon />
          Test details
        </Button>
        <PageHeader
          title={`Report — ${test.title}`}
          description={
            <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="flex items-center gap-1.5">
                <ClockIcon className="size-3.5" />
                <span className="numeric">{test.duration} min</span>
              </span>
              <span className="flex items-center gap-1.5">
                <ListChecksIcon className="size-3.5" />
                <span className="numeric">
                  {test._count?.questions ?? 0} questions
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <CalendarIcon className="size-3.5" />
                Created {format(new Date(test.createdAt), "MMM d, yyyy")}
              </span>
              <span className="numeric text-xs">
                Generated {format(new Date(), "MMM d, HH:mm")}
              </span>
            </span>
          }
          actions={<StatusBadge status={test.status} />}
        />
      </div>

      {s.totalStudents === 0 ? (
        <EmptyState
          icon={<BarChart3Icon />}
          title="No data yet"
          description="Metrics and charts appear once students attempt this test."
        />
      ) : (
        <>
          {/* Participation metrics */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {metrics.map((m) => (
              <Card key={m.label} size="sm">
                <CardContent className="space-y-1">
                  <p
                    className={cn(
                      "flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider",
                      m.tone ?? "text-muted-foreground",
                    )}
                  >
                    {m.icon}
                    {m.label}
                  </p>
                  <p className="numeric font-heading text-2xl font-bold">
                    {m.value}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Score metrics */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {scoreMetrics.map((m) => (
              <Card key={m.label} size="sm">
                <CardContent className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {m.label}
                    </p>
                    <p className="numeric font-heading text-2xl font-bold">
                      {m.value}
                    </p>
                  </div>
                  {m.icon}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Completion status */}
            <Card>
              <CardContent className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Completion status
                </h3>
                <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
                  {segments
                    .filter((seg) => seg.count > 0)
                    .map((seg) => (
                      <div
                        key={seg.label}
                        className={cn(
                          "h-full transition-all",
                          seg.className,
                        )}
                        style={{
                          width: `${(seg.count / s.totalStudents) * 100}%`,
                        }}
                        title={`${seg.label}: ${seg.count}`}
                      />
                    ))}
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  {segments.map((seg) => (
                    <div
                      key={seg.label}
                      className="flex items-center gap-2 text-sm"
                    >
                      <span
                        className={cn(
                          "inline-block size-3 rounded-sm",
                          seg.className,
                        )}
                      />
                      <span className="text-muted-foreground">
                        {seg.label}
                      </span>
                      <span className="numeric font-semibold">
                        {seg.count}
                      </span>
                      <span className="numeric text-xs text-muted-foreground">
                        (
                        {s.totalStudents > 0
                          ? Math.round(
                              (seg.count / s.totalStudents) * 100,
                            )
                          : 0}
                        %)
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Score distribution */}
            <Card>
              <CardContent className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Score distribution{" "}
                  <span className="font-normal normal-case">
                    (% ranges)
                  </span>
                </h3>
                {percentages.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No submitted scores yet.
                  </p>
                ) : (
                  <div className="flex h-36 items-end gap-2 sm:gap-3">
                    {distribution.map((bucket) => (
                      <div
                        key={bucket.label}
                        className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
                      >
                        <span className="numeric text-xs font-semibold">
                          {bucket.count > 0 ? bucket.count : ""}
                        </span>
                        <div
                          className={cn(
                            "w-full rounded-t-md transition-all",
                            bucket.count > 0
                              ? "bg-electric/70"
                              : "bg-muted",
                          )}
                          style={{
                            height: `${Math.max(
                              (bucket.count / maxBucket) * 100,
                              bucket.count > 0 ? 8 : 3,
                            )}%`,
                          }}
                        />
                        <span className="numeric text-[10px] text-muted-foreground">
                          {bucket.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
