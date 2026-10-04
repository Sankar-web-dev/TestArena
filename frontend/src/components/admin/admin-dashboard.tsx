"use client";

import Link from "next/link";
import {
  ArrowRightIcon,
  BarChart3Icon,
  FilePlusIcon,
  FileTextIcon,
  GraduationCapIcon,
  ListChecksIcon,
  RadioIcon,
} from "lucide-react";

import { useMyTests } from "@/hooks/queries/use-tests";
import { useAdminStats } from "@/hooks/queries/use-users";
import type { AdminTest } from "@/lib/api/types";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { StatusBadge } from "@/components/common/status-badge";
import { EmptyState } from "@/components/common/empty-state";
import { LoadingState } from "@/components/common/loading-state";
import { ErrorState } from "@/components/common/error-state";
import { Button } from "@/components/ui/button";
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

const PUBLISHED_STATUSES = new Set([
  "PUBLISHED",
  "LIVE",
  "ENDED",
]);

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function computeStats(tests: AdminTest[]) {
  return {
    total: tests.length,
    published: tests.filter((t) =>
      PUBLISHED_STATUSES.has(t.status),
    ).length,
    liveNow: tests.filter((t) => t.status === "LIVE").length,
    drafts: tests.filter(
      (t) => t.status === "DRAFT" || t.status === "READY",
    ).length,
    questions: tests.reduce(
      (sum, t) => sum + (t._count?.questions ?? 0),
      0,
    ),
  };
}

export function AdminDashboard({
  userName,
}: {
  userName: string;
}) {
  const { data, isPending, isError, error, refetch } =
    useMyTests();
  const statsQuery = useAdminStats();

  const tests = data ?? [];
  const adminStats = statsQuery.data;
  const stats = computeStats(tests);
  const recentTests = tests.slice(0, 6);

  return (
    <div className="space-y-8">
      {/* Welcome band — subtle competition texture */}
      <div className="relative overflow-hidden rounded-xl border bg-card">
        <div className="bg-dot-grid pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <PageHeader
            title={`Welcome back, ${userName}`}
            description="Platform overview and quick actions"
          />
          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              render={<Link href="/admin/results" />}
            >
              <BarChart3Icon />
              View Results
            </Button>
            <Button
              size="sm"
              className="glow-electric bg-electric text-electric-foreground hover:bg-electric/90"
              render={<Link href="/admin/tests/new" />}
            >
              <FilePlusIcon />
              Create Test
            </Button>
          </div>
        </div>
      </div>

      {/* Live banner */}
      {!isPending && stats.liveNow > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-live/25 bg-live/5 px-4 py-3">
          <span className="relative flex size-2">
            <span className="animate-pulse-dot absolute inline-flex size-full rounded-full bg-live" />
          </span>
          <p className="text-sm font-medium">
            <span className="numeric font-semibold text-live">
              {stats.liveNow}
            </span>{" "}
            {stats.liveNow === 1
              ? "test is"
              : "tests are"}{" "}
            live right now
          </p>
        </div>
      )}

      {/* Stats — server-side platform metrics */}
      {statsQuery.isPending || isPending ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Card key={i} size="sm">
              <CardContent className="space-y-2">
                <div className="h-3 w-20 rounded bg-muted" />
                <div className="h-7 w-16 rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Total Students"
            value={adminStats?.students ?? 0}
            hint="registered accounts"
            icon={<GraduationCapIcon />}
            accent="electric"
          />
          <StatCard
            label="Total Questions"
            value={adminStats?.questions ?? stats.questions}
            hint="across all tests"
            icon={<ListChecksIcon />}
          />
          <StatCard
            label="Total Tests"
            value={adminStats?.tests.total ?? stats.total}
            icon={<FileTextIcon />}
            accent="electric"
          />
          <StatCard
            label="Published"
            value={
              adminStats?.tests.published ?? stats.published
            }
            hint={
              stats.liveNow > 0
                ? `${stats.liveNow} live now`
                : "incl. live & ended"
            }
            icon={<RadioIcon />}
            accent="success"
          />
          <StatCard
            label="Drafts"
            value={adminStats?.tests.drafts ?? stats.drafts}
            hint="unpublished"
            icon={<FileTextIcon />}
          />
        </div>
      )}

      {/* Recent tests */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="accent-line pl-4 font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Recent Tests
          </h2>
          <Button
            variant="ghost"
            size="sm"
            render={<Link href="/admin/tests" />}
          >
            Manage Tests
            <ArrowRightIcon />
          </Button>
        </div>

        <Card>
          {isPending ? (
            <CardContent className="pt-2">
              <LoadingState rows={4} />
            </CardContent>
          ) : isError ? (
            <CardContent>
              <ErrorState
                error={error}
                onRetry={() => void refetch()}
              />
            </CardContent>
          ) : tests.length === 0 ? (
            <CardContent className="p-0 pb-4">
              <EmptyState
                icon={<FileTextIcon />}
                title="No tests yet"
                description="Create your first assessment to get started."
                action={
                  <Button
                    size="sm"
                    className="bg-electric text-electric-foreground hover:bg-electric/90"
                    render={<Link href="/admin/tests/new" />}
                  >
                    <FilePlusIcon />
                    Create Test
                  </Button>
                }
                className="border-0"
              />
            </CardContent>
          ) : (
            <CardContent className="px-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Test</TableHead>
                      <TableHead className="text-right">
                        Questions
                      </TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-24">
                        <span className="sr-only">
                          Actions
                        </span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentTests.map((test) => (
                      <TableRow
                        key={test.id}
                        className="transition-colors hover:bg-muted/60"
                      >
                        <TableCell>
                          <div className="max-w-64">
                            <p className="truncate font-medium">
                              {test.title}
                            </p>
                            {test.description && (
                              <p className="truncate text-xs text-muted-foreground">
                                {test.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="numeric text-right">
                          {test._count?.questions ?? 0}
                        </TableCell>
                        <TableCell className="numeric whitespace-nowrap text-muted-foreground">
                          {test.duration} min
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={test.status} />
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {formatDate(test.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            render={
                              <Link href="/admin/tests" />
                            }
                          >
                            Manage
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          )}
        </Card>
      </section>
    </div>
  );
}
