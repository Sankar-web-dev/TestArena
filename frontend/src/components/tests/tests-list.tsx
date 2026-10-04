"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  ArrowUpDownIcon,
  BarChart3Icon,
  EyeIcon,
  FilePlusIcon,
  FileTextIcon,
  ListChecksIcon,
  MoreHorizontalIcon,
  PencilIcon,
  SearchIcon,
  SendIcon,
  Trash2Icon,
} from "lucide-react";

import { useMyTests } from "@/hooks/queries/use-tests";
import {
  useDeleteTest,
} from "@/hooks/mutations/use-test-mutations";
import { ApiError } from "@/lib/api/client";
import type { AdminTest, TestStatus } from "@/lib/api/types";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { EmptyState } from "@/components/common/empty-state";
import { LoadingState } from "@/components/common/loading-state";
import { ErrorState } from "@/components/common/error-state";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type StatusFilter = "ALL" | TestStatus;
type SortKey = "newest" | "oldest" | "title" | "status";

const STATUS_ORDER: Record<TestStatus, number> = {
  DRAFT: 0,
  READY: 1,
  PUBLISHED: 2,
  LIVE: 3,
  ENDED: 4,
};

const CAN_EDIT = new Set<TestStatus>(["DRAFT", "READY", "PUBLISHED"]);
const CAN_PUBLISH = new Set<TestStatus>(["DRAFT", "READY"]);
const CAN_DELETE = new Set<TestStatus>(["DRAFT", "READY"]);

interface TestsListProps {
  /** e.g. "/admin/tests" or "/teacher/tests" */
  basePath: string;
}

function formatWindow(test: AdminTest) {
  if (!test.startTime && !test.endTime) {
    return <span className="text-muted-foreground/60">—</span>;
  }
  const fmt = (iso: string) => format(new Date(iso), "MMM d, HH:mm");
  return (
    <span className="numeric whitespace-nowrap text-muted-foreground">
      {test.startTime ? fmt(test.startTime) : "—"}
      {" → "}
      {test.endTime ? fmt(test.endTime) : "—"}
    </span>
  );
}

export function TestsList({ basePath }: TestsListProps) {
  const router = useRouter();
  const { data, isPending, isError, error, refetch } = useMyTests();
  const deleteMutation = useDeleteTest();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [deleteTarget, setDeleteTarget] = useState<AdminTest | null>(null);

  const tests = useMemo(() => {
    let result = data ?? [];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q),
      );
    }

    if (statusFilter !== "ALL") {
      result = result.filter((t) => t.status === statusFilter);
    }

    return [...result].sort((a, b) => {
      switch (sortKey) {
        case "oldest":
          return (
            new Date(a.createdAt).getTime() -
            new Date(b.createdAt).getTime()
          );
        case "title":
          return a.title.localeCompare(b.title);
        case "status":
          return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
        default:
          return (
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
          );
      }
    });
  }, [data, search, statusFilter, sortKey]);

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success(`"${deleteTarget.title}" deleted`);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Delete failed",
      );
    } finally {
      setDeleteTarget(null);
    }
  }

  const isEmpty = (data ?? []).length === 0;
  const noMatches = !isEmpty && tests.length === 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tests"
        description="Create, schedule, and manage assessments"
        actions={
          <Button
            size="sm"
            className="glow-electric bg-electric text-electric-foreground hover:bg-electric/90"
            render={<Link href={`${basePath}/new`} />}
          >
            <FilePlusIcon />
            Create Test
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tests…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as StatusFilter)}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="READY">Ready</SelectItem>
            <SelectItem value="PUBLISHED">Published</SelectItem>
            <SelectItem value="LIVE">Live</SelectItem>
            <SelectItem value="ENDED">Ended</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={sortKey}
          onValueChange={(v) => setSortKey(v as SortKey)}
        >
          <SelectTrigger className="w-full sm:w-44">
            <ArrowUpDownIcon className="size-3.5" />
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
            <SelectItem value="title">Title A–Z</SelectItem>
            <SelectItem value="status">By status</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      <Card>
        {isPending ? (
          <CardContent className="pt-2">
            <LoadingState rows={4} />
          </CardContent>
        ) : isError ? (
          <CardContent>
            <ErrorState error={error} onRetry={() => void refetch()} />
          </CardContent>
        ) : isEmpty ? (
          <CardContent className="p-0 pb-4">
            <EmptyState
              icon={<FileTextIcon />}
              title="No tests yet"
              description="Create your first assessment to get started."
              action={
                <Button
                  size="sm"
                  className="bg-electric text-electric-foreground hover:bg-electric/90"
                  render={<Link href={`${basePath}/new`} />}
                >
                  <FilePlusIcon />
                  Create Test
                </Button>
              }
              className="border-0"
            />
          </CardContent>
        ) : noMatches ? (
          <CardContent className="p-0 pb-4">
            <EmptyState
              icon={<SearchIcon />}
              title="No matching tests"
              description="Try a different search or status filter."
              className="border-0"
            />
          </CardContent>
        ) : (
          <CardContent className="px-0">
            <div className="overflow-x-auto">
              <Table className="min-w-[760px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Test</TableHead>
                    <TableHead className="text-right">Questions</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-12">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tests.map((test) => (
                    <TableRow
                      key={test.id}
                      className="transition-colors hover:bg-muted/60"
                    >
                      <TableCell>
                        <Link
                          href={`${basePath}/${test.id}`}
                          className="block max-w-72 transition-colors hover:text-electric"
                        >
                          <p className="truncate font-medium">
                            {test.title}
                          </p>
                          {test.description && (
                            <p className="truncate text-xs text-muted-foreground">
                              {test.description}
                            </p>
                          )}
                        </Link>
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
                      <TableCell>{formatWindow(test)}</TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {format(new Date(test.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Actions for ${test.title}`}
                              />
                            }
                          >
                            <MoreHorizontalIcon />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(`${basePath}/${test.id}`)
                              }
                            >
                              <EyeIcon />
                              View
                            </DropdownMenuItem>
                            {CAN_EDIT.has(test.status) && (
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(
                                    `${basePath}/${test.id}/edit`,
                                  )
                                }
                              >
                                <PencilIcon />
                                Edit
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(
                                  `${basePath}/${test.id}/questions`,
                                )
                              }
                            >
                              <ListChecksIcon />
                              Questions
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(
                                  `${basePath}/${test.id}/results`,
                                )
                              }
                            >
                              <BarChart3Icon />
                              Results
                            </DropdownMenuItem>
                            {CAN_PUBLISH.has(test.status) && (
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(
                                    `${basePath}/${test.id}/publish`,
                                  )
                                }
                              >
                                <SendIcon />
                                Publish
                              </DropdownMenuItem>
                            )}
                            {CAN_DELETE.has(test.status) && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => setDeleteTarget(test)}
                                >
                                  <Trash2Icon />
                                  Delete
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Controlled dialogs — driven by dropdown menu items */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.title}"?`}
        description="This permanently removes the test and all its questions. This cannot be undone."
        confirmLabel={
          deleteMutation.isPending ? "Deleting…" : "Delete"
        }
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
