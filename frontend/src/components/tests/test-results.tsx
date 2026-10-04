"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowLeftIcon,
  ArrowUpDownIcon,
  BarChart3Icon,
  CrownIcon,
  FileTextIcon,
  DownloadIcon,
  MedalIcon,
  SearchIcon,
  TrophyIcon,
  UsersIcon,
} from "lucide-react";

import { useMyTests } from "@/hooks/queries/use-tests";
import {
  useLeaderboard,
  useTestResults,
} from "@/hooks/queries/use-tests";
import { API_URL } from "@/lib/api/client";
import type {
  LeaderboardEntry,
  TestResultEntry,
} from "@/lib/api/types";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { LoadingState } from "@/components/common/loading-state";
import { ErrorState } from "@/components/common/error-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type View = "results" | "leaderboard";
type SortKey = "score" | "percentage" | "submitted";

interface TestResultsProps {
  basePath: string;
  testId: number;
}

export function TestResults({ basePath, testId }: TestResultsProps) {
  const testsQuery = useMyTests();
  const resultsQuery = useTestResults(testId);
  const leaderboardQuery = useLeaderboard(testId);

  const test = testsQuery.data?.find((t) => t.id === testId);
  const [view, setView] = useState<View>("results");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("score");

  const isPending =
    testsQuery.isPending || resultsQuery.isPending;
  const isError = testsQuery.isError || resultsQuery.isError;
  const data = resultsQuery.data;

  const rows = useMemo(() => {
    let result = data?.results ?? [];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (r) =>
          r.attempt.student.name.toLowerCase().includes(q) ||
          r.attempt.student.email?.toLowerCase().includes(q),
      );
    }
    return [...result].sort((a, b) => {
      switch (sortKey) {
        case "percentage":
          return b.percentage - a.percentage;
        case "submitted":
          return (
            new Date(b.attempt.submittedAt ?? 0).getTime() -
            new Date(a.attempt.submittedAt ?? 0).getTime()
          );
        default:
          return b.score - a.score;
      }
    });
  }, [data, search, sortKey]);

  if (isPending) {
    return <LoadingState rows={5} />;
  }

  if (isError || !data) {
    return (
      <ErrorState
        error={resultsQuery.error ?? testsQuery.error}
        onRetry={() => {
          void resultsQuery.refetch();
          void testsQuery.refetch();
        }}
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
          title={`Results — ${test.title}`}
          description={`${data.totalStudents} submission${data.totalStudents === 1 ? "" : "s"} · ${test.duration} min exam`}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              {data.results.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  render={
                    <a
                      href={`${API_URL}/api/tests/${testId}/results/export`}
                      download
                    />
                  }
                >
                  <DownloadIcon />
                  Export CSV
                </Button>
              )}
              <div
                className="flex items-center gap-1 rounded-lg border bg-card p-1"
                role="tablist"
                aria-label="Results view"
              >
              {(
                [
                  { value: "results", label: "Results", icon: <BarChart3Icon className="size-3.5" /> },
                  { value: "leaderboard", label: "Leaderboard", icon: <TrophyIcon className="size-3.5" /> },
                ] as const
              ).map((v) => (
                <button
                  key={v.value}
                  role="tab"
                  aria-selected={view === v.value}
                  onClick={() => setView(v.value)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    view === v.value
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {v.icon}
                  {v.label}
                </button>
              ))}
              </div>
            </div>
          }
        />
      </div>

      {data.results.length === 0 ? (
        <EmptyState
          icon={<UsersIcon />}
          title="No submissions yet"
          description="Results appear here once students complete this test."
        />
      ) : view === "leaderboard" ? (
        <LeaderboardView
          entries={leaderboardQuery.data ?? []}
          isPending={leaderboardQuery.isPending}
          isError={leaderboardQuery.isError}
          error={leaderboardQuery.error}
          onRetry={() => void leaderboardQuery.refetch()}
        />
      ) : (
        <>
          {/* Controls */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:max-w-xs">
              <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search student…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={sortKey}
              onValueChange={(v) => setSortKey(v as SortKey)}
            >
              <SelectTrigger className="w-full sm:w-52">
                <ArrowUpDownIcon className="size-3.5" />
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="score">Highest score</SelectItem>
                <SelectItem value="percentage">
                  Highest percentage
                </SelectItem>
                <SelectItem value="submitted">
                  Latest submission
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {rows.length === 0 ? (
            <EmptyState
              icon={<SearchIcon />}
              title="No matching students"
              description="Try a different search."
            />
          ) : (
            <Card>
              <CardContent className="px-0">
                <div className="overflow-x-auto">
                  <Table className="min-w-[720px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead className="text-right">Score</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="w-40">Percentage</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((entry) => (
                        <ResultRow key={entry.id} entry={entry} />
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

// ---------- Results table row ----------

function ResultRow({ entry }: { entry: TestResultEntry }) {
  const pct = entry.percentage;
  return (
    <TableRow className="transition-colors hover:bg-muted/60">
      <TableCell>
        <div className="min-w-0">
          <p className="truncate font-medium">
            {entry.attempt.student.name}
          </p>
          {entry.attempt.student.email && (
            <p className="truncate text-xs text-muted-foreground">
              {entry.attempt.student.email}
            </p>
          )}
        </div>
      </TableCell>
      <TableCell className="numeric text-right font-semibold">
        {entry.score}
      </TableCell>
      <TableCell className="numeric text-right text-muted-foreground">
        {entry.totalMarks}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Progress value={pct} className="h-1.5 flex-1" />
          <span className="numeric w-12 text-right text-xs font-medium">
            {pct.toFixed(1)}%
          </span>
        </div>
      </TableCell>
      <TableCell className="whitespace-nowrap text-muted-foreground">
        {entry.attempt.submittedAt
          ? format(
              new Date(entry.attempt.submittedAt),
              "MMM d, HH:mm",
            )
          : "—"}
      </TableCell>
      <TableCell>
        <Badge
          variant="secondary"
          className="bg-success/10 text-success"
        >
          Submitted
        </Badge>
      </TableCell>
    </TableRow>
  );
}

// ---------- Leaderboard ----------

interface LeaderboardViewProps {
  entries: LeaderboardEntry[];
  isPending: boolean;
  isError: boolean;
  error: unknown;
  onRetry: () => void;
}

const RANK_STYLE: Record<number, string> = {
  1: "border-amber-400/60 bg-amber-400/10 text-amber-500",
  2: "border-slate-300/60 bg-slate-300/10 text-slate-400",
  3: "border-amber-700/50 bg-amber-700/10 text-amber-700",
};

function LeaderboardView({
  entries,
  isPending,
  isError,
  error,
  onRetry,
}: LeaderboardViewProps) {
  if (isPending) return <LoadingState rows={4} />;
  if (isError) return <ErrorState error={error} onRetry={onRetry} />;

  const podium = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div className="space-y-6">
      {/* Podium */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {podium.map((entry) => (
          <Card
            key={entry.student.id}
            className={cn(
              "relative overflow-hidden text-center transition-shadow hover:shadow-md",
              entry.rank === 1 &&
                "border-amber-400/50 shadow-[0_0_30px_-10px_#f59e0b]",
            )}
          >
            <div
              aria-hidden
              className={cn(
                "absolute inset-x-0 top-0 h-1",
                entry.rank === 1 && "bg-amber-400",
                entry.rank === 2 && "bg-slate-300",
                entry.rank === 3 && "bg-amber-700",
              )}
            />
            <CardContent className="space-y-2 pt-6">
              <div
                className={cn(
                  "mx-auto flex size-12 items-center justify-center rounded-full border-2",
                  RANK_STYLE[entry.rank],
                )}
              >
                {entry.rank === 1 ? (
                  <CrownIcon className="size-6" />
                ) : (
                  <MedalIcon className="size-6" />
                )}
              </div>
              <div>
                <p className="font-heading font-semibold">
                  {entry.student.name}
                </p>
                <p className="numeric text-sm text-muted-foreground">
                  Rank #{entry.rank}
                </p>
              </div>
              <p className="numeric font-heading text-2xl font-bold">
                {entry.score}
                <span className="text-sm font-medium text-muted-foreground">
                  {" "}
                  / {entry.totalMarks}
                </span>
              </p>
              <Badge variant="secondary" className="numeric">
                {entry.percentage.toFixed(1)}%
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Remaining ranks */}
      {rest.length > 0 && (
        <Card>
          <CardContent className="divide-y px-0">
            {rest.map((entry) => (
              <div
                key={entry.student.id}
                className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/50"
              >
                <span className="numeric flex size-8 shrink-0 items-center justify-center rounded-md border text-xs font-bold text-muted-foreground">
                  {entry.rank}
                </span>
                <p className="min-w-0 flex-1 truncate font-medium">
                  {entry.student.name}
                </p>
                <p className="numeric text-sm font-semibold">
                  {entry.score}
                  <span className="text-xs font-normal text-muted-foreground">
                    /{entry.totalMarks}
                  </span>
                </p>
                <Badge variant="secondary" className="numeric">
                  {entry.percentage.toFixed(1)}%
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
