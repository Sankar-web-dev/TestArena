"use client";

import Link from "next/link";
import {
  ArrowLeftIcon,
  ClipboardListIcon,
  MailIcon,
  UserRoundIcon,
} from "lucide-react";
import { format } from "date-fns";

import { useStudent } from "@/hooks/queries/use-users";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { StatusBadge } from "@/components/common/status-badge";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return format(new Date(iso), "MMM d, yyyy");
}

function UserStatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        status === "ACTIVE"
          ? "border-success/30 bg-success/10 text-success"
          : "border-muted-foreground/30 bg-muted text-muted-foreground",
      )}
    >
      {status === "ACTIVE" ? "Active" : "Inactive"}
    </Badge>
  );
}

export function UserDetail({
  basePath,
  userId,
}: {
  basePath: string;
  userId: string;
}) {
  const { data, isPending, isError, error, refetch } =
    useStudent(userId);

  return (
    <div className="space-y-5">
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 mb-2 text-muted-foreground"
          render={<Link href={basePath} />}
        >
          <ArrowLeftIcon />
          Students
        </Button>
        <PageHeader
          title="Student Profile"
          description={data?.email ?? ""}
        />
      </div>

      {isPending ? (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full rounded-xl" />
          <div className="grid gap-3 sm:grid-cols-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      ) : isError ? (
        <ErrorState
          error={error}
          onRetry={() => refetch()}
        />
      ) : !data ? null : (
        <>
          {/* Profile */}
          <Card>
            <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-3 py-4">
              <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <UserRoundIcon className="size-6" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-heading text-lg font-semibold">
                  {data.name}
                </p>
                <p className="flex items-center gap-1.5 truncate text-sm text-muted-foreground">
                  <MailIcon className="size-3.5 shrink-0" />
                  {data.email}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <UserStatusBadge status={data.status} />
                <p className="text-xs text-muted-foreground">
                  @{data.username ?? "—"} · joined{" "}
                  {formatDate(data.createdAt)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Stats + recent activity */}
          {"recentAttempts" in data ? (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <StatCard
                  label="Tests Attempted"
                  value={data.stats.attemptCount}
                  icon={<ClipboardListIcon />}
                />
                <StatCard
                  label="Tests Submitted"
                  value={data.stats.submittedCount}
                  accent="success"
                  icon={<ClipboardListIcon />}
                />
                <StatCard
                  label="Average Score"
                  value={
                    data.stats.averagePercentage != null
                      ? `${data.stats.averagePercentage.toFixed(1)}%`
                      : "—"
                  }
                  accent="electric"
                  icon={<ClipboardListIcon />}
                />
              </div>

              <section className="space-y-3">
                <h2 className="font-heading text-sm font-semibold">
                  Recent Attempts
                </h2>
                {data.recentAttempts.length === 0 ? (
                  <EmptyState
                    title="No attempts yet"
                    description="This student hasn't taken any tests."
                  />
                ) : (
                  <div className="overflow-x-auto rounded-xl border">
                    <Table className="min-w-[560px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Test</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Score</TableHead>
                          <TableHead>Started</TableHead>
                          <TableHead>Submitted</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.recentAttempts.map((a) => (
                          <TableRow key={a.id}>
                            <TableCell className="max-w-52 truncate font-medium">
                              {a.test.title}
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={a.status} />
                            </TableCell>
                            <TableCell className="numeric">
                              {a.result
                                ? `${a.result.score}/${a.result.totalMarks}`
                                : "—"}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {formatDate(a.startedAt)}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {formatDate(a.submittedAt)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </section>
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
