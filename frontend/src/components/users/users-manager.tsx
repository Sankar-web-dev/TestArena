"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisIcon,
  EyeIcon,
  GraduationCapIcon,
  KeyRoundIcon,
  PencilIcon,
  SearchIcon,
  UserPlusIcon,
  UserRoundCheckIcon,
  UserRoundXIcon,
} from "lucide-react";

import { useStudents } from "@/hooks/queries/use-users";
import type {
  ManagedUser,
  UserStatus,
} from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CreateUserDialog,
  EditUserDialog,
  ResetPasswordDialog,
  UserStatusDialog,
} from "./user-form-dialogs";
import { ImportStudentsDialog } from "./import-students-dialog";

type StatusFilter = "ALL" | UserStatus;

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: UserStatus }) {
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

export function UsersManager({
  basePath,
}: {
  basePath: string;
}) {

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("ALL");
  const [page, setPage] = useState(1);

  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editUser, setEditUser] = useState<ManagedUser | null>(null);
  const [resetUser, setResetUser] = useState<ManagedUser | null>(null);
  const [statusUser, setStatusUser] = useState<ManagedUser | null>(null);

  // Debounce search so we don't refetch on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const params = {
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    status:
      statusFilter === "ALL" ? undefined : statusFilter,
  };

  const { data, isPending, isError, error, refetch } =
    useStudents(params);
  const users = data?.data ?? [];
  const pagination = data?.pagination;
  const filtering = !!debouncedSearch || statusFilter !== "ALL";

  return (
    <div className="space-y-5">
      <PageHeader
        title="Students"
        description="Manage student accounts and access."
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setImportOpen(true)}
            >
              <UserPlusIcon />
              Import Students
            </Button>
            <Button
              size="sm"
              className="glow-electric bg-electric text-electric-foreground hover:bg-electric/90"
              onClick={() => setCreateOpen(true)}
            >
              <UserPlusIcon />
              Add Student
            </Button>
          </>
        }
      />

      {/* Search + filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search students…"
            className="pl-9"
            aria-label="Search students"
          />
        </div>

        <div
          className="flex w-fit max-w-full items-center gap-1 overflow-x-auto rounded-lg border bg-card p-1"
          role="tablist"
          aria-label="Filter by status"
        >
          {FILTERS.map((f) => (
            <button
              key={f.value}
              role="tab"
              aria-selected={statusFilter === f.value}
              onClick={() => {
                setStatusFilter(f.value);
                setPage(1);
              }}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                statusFilter === f.value
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isPending ? (
        <div className="space-y-2 rounded-xl border p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          error={error}
          onRetry={() => refetch()}
        />
      ) : users.length === 0 ? (
        <EmptyState
          icon={<GraduationCapIcon />}
          title={
            filtering
              ? "No students match your search"
              : "No students found"
          }
          description={
            filtering
              ? "Try a different search or filter."
              : "Create the first student account to get started."
          }
          action={
            !filtering ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCreateOpen(true)}
              >
                <UserPlusIcon />
                Add Student
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border">
            <Table className="min-w-[680px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="numeric text-right">
                    Tests Taken
                  </TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-12 text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="max-w-44 truncate font-medium">
                      <Link
                        href={`${basePath}/${user.id}`}
                        className="hover:underline"
                      >
                        {user.name}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-32 truncate text-muted-foreground">
                      {user.username ?? "—"}
                    </TableCell>
                    <TableCell className="max-w-52 truncate text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={user.status} />
                    </TableCell>
                    <TableCell className="numeric text-right">
                      {user._count?.attempts ?? 0}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Actions for ${user.name}`}
                            />
                          }
                        >
                          <EllipsisIcon />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-44"
                        >
                          <DropdownMenuItem
                            render={
                              <Link
                                href={`${basePath}/${user.id}`}
                              />
                            }
                          >
                            <EyeIcon />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setEditUser(user)}
                          >
                            <PencilIcon />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setResetUser(user)}
                          >
                            <KeyRoundIcon />
                            Reset Password
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant={
                              user.status === "ACTIVE"
                                ? "destructive"
                                : "default"
                            }
                            onClick={() => setStatusUser(user)}
                          >
                            {user.status === "ACTIVE" ? (
                              <>
                                <UserRoundXIcon />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <UserRoundCheckIcon />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination && (
            <div className="flex items-center justify-between gap-3 text-sm">
              <p className="text-muted-foreground">
                <span className="numeric font-medium text-foreground">
                  {pagination.total}
                </span>{" "}
                student{pagination.total === 1 ? "" : "s"} · page{" "}
                <span className="numeric">{pagination.page}</span>{" "}
                of{" "}
                <span className="numeric">
                  {pagination.totalPages}
                </span>
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeftIcon />
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={
                    pagination.page >= pagination.totalPages
                  }
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                  <ChevronRightIcon />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Dialogs */}
      <CreateUserDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
      <EditUserDialog
        user={editUser}
        onClose={() => setEditUser(null)}
      />
      <ResetPasswordDialog
        user={resetUser}
        onClose={() => setResetUser(null)}
      />
      <UserStatusDialog
        user={statusUser}
        onClose={() => setStatusUser(null)}
      />
      <ImportStudentsDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
      />
    </div>
  );
}
