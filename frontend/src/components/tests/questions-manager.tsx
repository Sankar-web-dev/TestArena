"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeftIcon,
  BanIcon,
  CheckCircle2Icon,
  ClipboardCheckIcon,
  FileSpreadsheetIcon,
  ListChecksIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react";

import { useMyTests } from "@/hooks/queries/use-tests";
import { useQuestions } from "@/hooks/queries/use-questions";
import {
  useDeleteQuestion,
  useRejectQuestion,
  useVerifyAllQuestions,
  useVerifyQuestion,
} from "@/hooks/mutations/use-test-mutations";
import { ApiError } from "@/lib/api/client";
import type { Question, QuestionStatus } from "@/lib/api/types";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { EmptyState } from "@/components/common/empty-state";
import { LoadingState } from "@/components/common/loading-state";
import { ErrorState } from "@/components/common/error-state";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { RichText } from "@/components/common/rich-text";
import { QuestionForm } from "./question-form";
import { QuestionImport } from "./question-import";
import { VerificationWorkspace } from "./verification-workspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type StatusFilter = "ALL" | QuestionStatus;

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "DRAFT", label: "Draft" },
  { value: "VERIFIED", label: "Verified" },
  { value: "REJECTED", label: "Rejected" },
];

const CAN_VERIFY = new Set<QuestionStatus>(["DRAFT", "REJECTED"]);
const CAN_REJECT = new Set<QuestionStatus>(["DRAFT", "VERIFIED"]);

interface QuestionsManagerProps {
  basePath: string;
  testId: number;
}

export function QuestionsManager({
  basePath,
  testId,
}: QuestionsManagerProps) {
  const testsQuery = useMyTests();
  const {
    data: questions,
    isPending,
    isError,
    error,
    refetch,
  } = useQuestions(testId);

  const deleteMutation = useDeleteQuestion(testId);
  const verifyMutation = useVerifyQuestion(testId);
  const verifyAllMutation = useVerifyAllQuestions(testId);
  const rejectMutation = useRejectQuestion(testId);

  const test = testsQuery.data?.find((t) => t.id === testId);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("ALL");
  const [formOpen, setFormOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] =
    useState<Question | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<Question | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [view, setView] = useState<"list" | "review">("list");

  const all = useMemo(() => questions ?? [], [questions]);

  const counts = useMemo(() => {
    const map = new Map<StatusFilter, number>();
    map.set("ALL", all.length);
    for (const q of all) {
      map.set(q.status, (map.get(q.status) ?? 0) + 1);
    }
    return map;
  }, [all]);

  const filtered = useMemo(() => {
    let result = all;
    if (statusFilter !== "ALL") {
      result = result.filter((q) => q.status === statusFilter);
    }
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      result = result.filter((q) =>
        q.questionText.toLowerCase().includes(s),
      );
    }
    return result;
  }, [all, statusFilter, search]);

  const totalMarks = all.reduce((sum, q) => sum + q.marks, 0);
  const unverifiedCount = all.filter((q) =>
    CAN_VERIFY.has(q.status),
  ).length;

  async function handleVerify(
    question: Question,
  ): Promise<boolean> {
    try {
      await verifyMutation.mutateAsync(question.id);
      toast.success("Question verified");
      return true;
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Verify failed",
      );
      return false;
    }
  }

  async function handleReject(
    question: Question,
  ): Promise<boolean> {
    try {
      await rejectMutation.mutateAsync(question.id);
      toast.success("Question rejected");
      return true;
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Reject failed",
      );
      return false;
    }
  }

  async function handleVerifyAll() {
    try {
      const result = await verifyAllMutation.mutateAsync();
      toast.success(
        result.count > 0
          ? `${result.count} question${result.count === 1 ? "" : "s"} verified`
          : "Nothing to verify",
      );
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.message
          : "Verify all failed",
      );
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success("Question deleted");
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Delete failed",
      );
    } finally {
      setDeleteTarget(null);
    }
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
          title={test ? `Questions — ${test.title}` : "Questions"}
          description={
            all.length > 0
              ? `${all.length} question${all.length === 1 ? "" : "s"} · ${totalMarks} marks total · editing a question resets it to Draft`
              : "Add questions, verify them, then publish the test"
          }
          actions={
            <>
              {unverifiedCount > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-success/40 text-success hover:bg-success/10"
                  disabled={verifyAllMutation.isPending}
                  onClick={() => void handleVerifyAll()}
                >
                  <CheckCircle2Icon />
                  {verifyAllMutation.isPending
                    ? "Verifying…"
                    : `Verify All (${unverifiedCount})`}
                </Button>
              )}
              {all.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setView("review")}
                >
                  <ClipboardCheckIcon />
                  Review
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setImportOpen(true)}
              >
                <FileSpreadsheetIcon />
                Import Excel
              </Button>
              <Button
                size="sm"
                className="glow-electric bg-electric text-electric-foreground hover:bg-electric/90"
                onClick={() => {
                  setEditingQuestion(null);
                  setFormOpen(true);
                }}
              >
                <PlusIcon />
                Add Question
              </Button>
            </>
          }
        />
      </div>

      {view === "review" && all.length > 0 ? (
        <VerificationWorkspace
          questions={all}
          onExit={() => setView("list")}
          onVerify={handleVerify}
          onReject={handleReject}
          onEdit={(question) => {
            setEditingQuestion(question);
            setFormOpen(true);
          }}
          busy={
            verifyMutation.isPending ||
            verifyAllMutation.isPending ||
            rejectMutation.isPending
          }
          shortcutsDisabled={
            formOpen || importOpen || !!deleteTarget
          }
        />
      ) : (
        <>
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
              onClick={() => setStatusFilter(f.value)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                statusFilter === f.value
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
              <span className="numeric opacity-70">
                {counts.get(f.value) ?? 0}
              </span>
            </button>
          ))}
        </div>
        <div className="relative flex-1 sm:max-w-xs">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search question text…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* List */}
      {isPending ? (
        <LoadingState rows={4} />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : all.length === 0 ? (
        <EmptyState
          icon={<ListChecksIcon />}
          title="No questions yet"
          description="Add the first question to start building this test."
          action={
            <Button
              size="sm"
              className="bg-electric text-electric-foreground hover:bg-electric/90"
              onClick={() => {
                setEditingQuestion(null);
                setFormOpen(true);
              }}
            >
              <PlusIcon />
              Add Question
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<SearchIcon />}
          title="No matching questions"
          description="Try a different search or status filter."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((question) => {
            const index = all.findIndex((q) => q.id === question.id);
            return (
              <QuestionCard
                key={question.id}
                question={question}
                index={index}
                onEdit={() => {
                  setEditingQuestion(question);
                  setFormOpen(true);
                }}
                onVerify={() => void handleVerify(question)}
                onReject={() => void handleReject(question)}
                onDelete={() => setDeleteTarget(question)}
                busy={
                  verifyMutation.isPending ||
                  verifyAllMutation.isPending ||
                  rejectMutation.isPending
                }
              />
            );
          })}
        </div>
      )}

        </>
      )}

      <QuestionForm
        testId={testId}
        open={formOpen}
        onOpenChange={setFormOpen}
        question={editingQuestion ?? undefined}
      />

      <QuestionImport
        testId={testId}
        open={importOpen}
        onOpenChange={setImportOpen}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete this question?"
        description={`"${deleteTarget?.questionText.slice(0, 80)}${(deleteTarget?.questionText.length ?? 0) > 80 ? "…" : ""}" will be permanently removed. This cannot be undone.`}
        confirmLabel={
          deleteMutation.isPending ? "Deleting…" : "Delete"
        }
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}

interface QuestionCardProps {
  question: Question;
  index: number;
  onEdit: () => void;
  onVerify: () => void;
  onReject: () => void;
  onDelete: () => void;
  busy: boolean;
}

function QuestionCard({
  question,
  index,
  onEdit,
  onVerify,
  onReject,
  onDelete,
  busy,
}: QuestionCardProps) {
  return (
    <Card
      size="sm"
      className="transition-shadow hover:shadow-md"
    >
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3">
          <span className="accent-line flex size-7 shrink-0 items-center justify-center rounded-md bg-muted pl-0 text-xs font-bold numeric">
            {index + 1}
          </span>
          <div className="min-w-0 flex-1">
            <RichText
              text={question.questionText}
              className="text-sm font-medium leading-relaxed"
            />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge variant="secondary" className="numeric">
              {question.marks}{" "}
              {question.marks === 1 ? "mark" : "marks"}
            </Badge>
            <StatusBadge status={question.status} />
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Question actions"
                    disabled={busy}
                  />
                }
              >
                <MoreHorizontalIcon />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={onEdit}>
                  <PencilIcon />
                  Edit
                </DropdownMenuItem>
                {CAN_VERIFY.has(question.status) && (
                  <DropdownMenuItem onClick={onVerify}>
                    <CheckCircle2Icon className="text-success" />
                    Verify
                  </DropdownMenuItem>
                )}
                {CAN_REJECT.has(question.status) && (
                  <DropdownMenuItem onClick={onReject}>
                    <BanIcon className="text-warning" />
                    Reject
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={onDelete}
                >
                  <Trash2Icon />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Options — correct answer visible to admin/teacher only */}
        <div className="grid grid-cols-1 gap-2 pl-10 sm:grid-cols-2">
          {question.options
            .slice()
            .sort((a, b) => a.optionKey.localeCompare(b.optionKey))
            .map((option) => {
              const isCorrect =
                option.optionKey === question.correctOption;
              return (
                <div
                  key={option.id}
                  className={cn(
                    "flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
                    isCorrect
                      ? "border-success/40 bg-success/5 text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded text-[10px] font-bold",
                      isCorrect
                        ? "bg-success text-white"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {option.optionKey}
                  </span>
                  <div className="min-w-0 flex-1">
                    <RichText
                      text={option.optionText}
                      compact
                    />
                  </div>
                  {isCorrect && (
                    <CheckCircle2Icon className="size-4 shrink-0 text-success" />
                  )}
                </div>
              );
            })}
        </div>
      </CardContent>
    </Card>
  );
}
