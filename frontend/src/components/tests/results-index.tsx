"use client";

import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowRightIcon,
  BarChart3Icon,
  SearchIcon,
  UsersIcon,
} from "lucide-react";
import { useState } from "react";

import { useMyTests } from "@/hooks/queries/use-tests";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { EmptyState } from "@/components/common/empty-state";
import { LoadingState } from "@/components/common/loading-state";
import { ErrorState } from "@/components/common/error-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

interface ResultsIndexProps {
  /** e.g. "/admin/tests" — detail links append the test id */
  testsBasePath: string;
  /** Which per-test page the cards link to */
  mode?: "results" | "report";
}

export function ResultsIndex({
  testsBasePath,
  mode = "results",
}: ResultsIndexProps) {
  const { data, isPending, isError, error, refetch } = useMyTests();
  const [search, setSearch] = useState("");

  const isReport = mode === "report";

  const tests = (data ?? []).filter((t) => {
    if (!search.trim()) return true;
    return t.title
      .toLowerCase()
      .includes(search.trim().toLowerCase());
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={isReport ? "Reports" : "Results"}
        description={
          isReport
            ? "Aggregate metrics and performance analysis"
            : "Scores and leaderboards for your tests"
        }
      />

      <div className="relative max-w-xs">
        <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search tests…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isPending ? (
        <LoadingState rows={4} />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : tests.length === 0 ? (
        <EmptyState
          icon={<BarChart3Icon />}
          title={
            (data ?? []).length === 0
              ? "No tests yet"
              : "No matching tests"
          }
          description={
            (data ?? []).length === 0
              ? "Create and publish a test first — results appear after students submit."
              : "Try a different search."
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tests.map((test) => (
            <Card
              key={test.id}
              size="sm"
              className="transition-shadow hover:shadow-md"
            >
              <CardContent className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 flex-1 truncate font-medium">
                    {test.title}
                  </p>
                  <StatusBadge status={test.status} />
                </div>
                <div className="numeric flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <UsersIcon className="size-3.5" />
                    {test._count?.attempts ?? 0} attempts
                  </span>
                  <span>
                    {test.endTime
                      ? `Ends ${format(new Date(test.endTime), "MMM d")}`
                      : `Created ${format(new Date(test.createdAt), "MMM d")}`}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  render={
                    <Link
                      href={`${testsBasePath}/${test.id}/${mode}`}
                    />
                  }
                >
                  <BarChart3Icon />
                  {isReport ? "View report" : "View results"}
                  <ArrowRightIcon />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
