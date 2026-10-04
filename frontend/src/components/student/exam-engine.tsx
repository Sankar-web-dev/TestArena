"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CircleAlertIcon,
  ClockIcon,
  FlagIcon,
  HourglassIcon,
  LayoutGridIcon,
  Loader2Icon,
  MaximizeIcon,
  RefreshCcwIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  TrophyIcon,
} from "lucide-react";

import { useAttemptQuestions } from "@/hooks/queries/use-attempt";
import {
  useSaveAnswer,
  useSubmitAttempt,
} from "@/hooks/mutations/use-attempt-mutations";
import { ApiError } from "@/lib/api/client";
import type { AttemptQuestion } from "@/lib/api/types";
import { ErrorState } from "@/components/common/error-state";
import { RichText } from "@/components/common/rich-text";
import { EmptyState } from "@/components/common/empty-state";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

type SaveStatus = "saving" | "saved" | "error";

interface AnswerEntry {
  option: string;
  status: SaveStatus;
}

interface ExamEngineProps {
  attemptId: number;
}

const WARNING_SECONDS = 5 * 60;
const CRITICAL_SECONDS = 60;

export function ExamEngine({ attemptId }: ExamEngineProps) {
  const { data, isPending, isError, error, refetch } =
    useAttemptQuestions(attemptId);
  const saveMutation = useSaveAnswer();
  const submitMutation = useSubmitAttempt();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [overlay, setOverlay] = useState<
    Record<number, AnswerEntry>
  >({});
  const [submitted, setSubmitted] = useState(false);
  const [expired, setExpired] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  // ---------- Proctoring ----------
  const [examStarted, setExamStarted] = useState(false);
  const [terminated, setTerminated] = useState(false);
  const [warningOpen, setWarningOpen] = useState(false);
  const violationsRef = useRef(0);
  const warningRef = useRef(false);
  const lastViolationAtRef = useRef(0);

  const questions = data?.questions ?? [];
  const total = questions.length;
  const index = Math.min(currentIndex, Math.max(0, total - 1));
  const question = questions[index];

  // ---------- Server-authoritative countdown ----------
  const expiresAtMs = useMemo(
    () => (data ? new Date(data.expiresAt).getTime() : 0),
    [data],
  );
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const expiredRef = useRef(false);

  useEffect(() => {
    if (!expiresAtMs) return;

    const tick = () => {
      const left = Math.max(0, expiresAtMs - Date.now());
      setTimeLeft(left);
      if (left === 0 && !expiredRef.current) {
        expiredRef.current = true;
        setExpired(true);
        // One touch so the backend marks the attempt EXPIRED.
        void refetch();
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAtMs, refetch]);

  // ---------- Proctoring: focus & fullscreen watchdog ----------
  const examActive =
    examStarted && !submitted && !expired && !terminated;

  useEffect(() => {
    if (!examActive) return;

    const violate = () => {
      if (warningRef.current) return;
      const now = Date.now();
      // blur + visibilitychange fire together — count once.
      if (now - lastViolationAtRef.current < 1500) return;
      lastViolationAtRef.current = now;

      violationsRef.current += 1;
      if (violationsRef.current >= 2) {
        setTerminated(true);
        void handleSubmit();
      } else {
        warningRef.current = true;
        setWarningOpen(true);
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") violate();
    };
    const onBlur = () => violate();
    const onFullscreen = () => {
      if (!document.fullscreenElement) violate();
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    document.addEventListener("fullscreenchange", onFullscreen);
    return () => {
      document.removeEventListener(
        "visibilitychange",
        onVisibility,
      );
      window.removeEventListener("blur", onBlur);
      document.removeEventListener(
        "fullscreenchange",
        onFullscreen,
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examActive]);

  // Leave full screen once the exam is over.
  useEffect(() => {
    if (
      (submitted || expired || terminated) &&
      document.fullscreenElement
    ) {
      void document.exitFullscreen().catch(() => {});
    }
  }, [submitted, expired, terminated]);

  async function beginExam() {
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      // Full screen unsupported (e.g. iOS Safari) — the
      // focus watchdog still protects the exam.
    }
    setExamStarted(true);
  }

  function acknowledgeWarning() {
    warningRef.current = false;
    setWarningOpen(false);
    void document.documentElement
      .requestFullscreen()
      .catch(() => {});
  }

  // ---------- Answer state (server data + local overlay) ----------
  function answerOf(q: AttemptQuestion): AnswerEntry | undefined {
    const local = overlay[q.questionId];
    if (local) return local;
    if (q.selectedOption) {
      return { option: q.selectedOption, status: "saved" };
    }
    return undefined;
  }

  const answeredCount = useMemo(
    () =>
      questions.filter((q) => answerOf(q)?.option).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [questions, overlay],
  );

  function selectOption(q: AttemptQuestion, optionKey: string) {
    if (submitted || expired) return;
    const current = answerOf(q);
    if (current?.option === optionKey && current.status !== "error")
      return;

    setOverlay((prev) => ({
      ...prev,
      [q.questionId]: { option: optionKey, status: "saving" },
    }));

    saveMutation.mutate(
      {
        attemptId,
        questionId: q.questionId,
        selectedOption: optionKey,
      },
      {
        onSuccess: () => {
          setOverlay((prev) => ({
            ...prev,
            [q.questionId]: { option: optionKey, status: "saved" },
          }));
        },
        onError: () => {
          // Keep the user's selection — never silently lose input.
          setOverlay((prev) => ({
            ...prev,
            [q.questionId]: { option: optionKey, status: "error" },
          }));
        },
      },
    );
  }

  async function handleSubmit() {
    try {
      await submitMutation.mutateAsync(attemptId);
      setSubmitted(true);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "";
      if (message.toLowerCase().includes("expired")) {
        setExpired(true);
      } else if (message.toLowerCase().includes("submit")) {
        setSubmitted(true);
      }
    }
  }

  // ---------- Derived UI states ----------
  if (isPending) {
    return <ExamSkeleton />;
  }

  if (isError) {
    const message =
      error instanceof ApiError
        ? error.message.toLowerCase()
        : "";
    if (message.includes("expired")) {
      return <ExamEndScreen kind="expired" />;
    }
    if (message.includes("submitted")) {
      return <ExamEndScreen kind="submitted" />;
    }
    return (
      <ErrorState
        error={error}
        onRetry={() => void refetch()}
        className="min-h-[60vh]"
      />
    );
  }

  if (terminated) {
    return <ExamEndScreen kind="terminated" />;
  }
  if (submitted) {
    return <ExamEndScreen kind="submitted" />;
  }
  if (expired) {
    return <ExamEndScreen kind="expired" />;
  }
  if (!question) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <EmptyState
          icon={<CircleAlertIcon />}
          title="No questions"
          description="This test has no questions to answer."
          action={
            <Button
              variant="outline"
              size="sm"
              render={<Link href="/student" />}
            >
              Back to dashboard
            </Button>
          }
          className="max-w-md"
        />
      </div>
    );
  }

  if (!examStarted) {
    const startedAtMs = new Date(data.startedAt).getTime();
    const minutes = Math.max(
      1,
      Math.round((expiresAtMs - startedAtMs) / 60000),
    );
    return (
      <ExamGate
        title={data.test.title}
        description={data.test.description}
        minutes={minutes}
        total={total}
        onBegin={beginExam}
      />
    );
  }

  const current = answerOf(question);
  const timerTone =
    timeLeft === null
      ? "normal"
      : timeLeft <= CRITICAL_SECONDS * 1000
        ? "critical"
        : timeLeft <= WARNING_SECONDS * 1000
          ? "warning"
          : "normal";

  const navigator = (
    <QuestionNavigator
      questions={questions}
      index={index}
      answerOf={answerOf}
      onSelect={(i) => {
        setCurrentIndex(i);
        setNavOpen(false);
      }}
    />
  );

  return (
    <div
      className="flex min-h-screen flex-col bg-background select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              {data.test.title}
            </p>
            <p className="numeric text-xs text-muted-foreground">
              Question {index + 1} of {total}
            </p>
          </div>
          <span className="hidden items-center gap-1.5 text-xs font-medium text-success sm:flex">
            <ShieldCheckIcon className="size-3.5" />
            Proctored
          </span>
          <TimerPill timeLeft={timeLeft} tone={timerTone} />
          <Button
            size="sm"
            variant="outline"
            className="hidden border-electric/40 text-electric hover:bg-electric/10 sm:inline-flex"
            disabled={submitMutation.isPending}
            onClick={() => setConfirmOpen(true)}
          >
            <FlagIcon />
            Submit
          </Button>
        </div>
        {/* Progress bar — answered share */}
        <div className="h-0.5 bg-muted">
          <div
            className="h-full bg-electric transition-[width] duration-300"
            style={{
              width: `${total ? (answeredCount / total) * 100 : 0}%`,
            }}
          />
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto grid w-full max-w-5xl flex-1 gap-4 px-4 py-5 pb-24 lg:grid-cols-[1fr_280px] lg:pb-5">
        {/* Question area */}
        <Card key={question.id} className="animate-fade-in-up h-fit">
          <CardContent className="space-y-5">
            <div className="flex items-start justify-between gap-3">
              <span className="accent-line flex size-8 shrink-0 items-center justify-center rounded-md bg-muted pl-0 text-sm font-bold numeric">
                {index + 1}
              </span>
              <Badge variant="secondary" className="numeric">
                {question.marks}{" "}
                {question.marks === 1 ? "mark" : "marks"}
              </Badge>
            </div>

            <RichText
              text={question.questionText}
              className="text-base font-medium leading-relaxed sm:text-lg"
            />

            <div className="space-y-2" role="radiogroup" aria-label="Answer options">
              {question.options.map((option) => {
                const selected =
                  current?.option === option.optionKey;
                return (
                  <button
                    key={option.optionKey}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() =>
                      selectOption(question, option.optionKey)
                    }
                    className={cn(
                      "flex min-h-12 w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-base",
                      selected
                        ? "border-electric bg-electric/10 font-medium"
                        : "hover:bg-muted/50 active:bg-muted",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-bold transition-colors",
                        selected
                          ? "border-electric bg-electric text-electric-foreground"
                          : "border-muted-foreground/40 text-muted-foreground",
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
                  </button>
                );
              })}
            </div>

            {/* Save status */}
            <div className="flex h-5 items-center text-xs">
              {current?.status === "saving" && (
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Loader2Icon className="size-3.5 animate-spin" />
                  Saving…
                </span>
              )}
              {current?.status === "saved" && (
                <span className="flex items-center gap-1.5 text-success">
                  <CheckCircle2Icon className="size-3.5" />
                  Saved
                </span>
              )}
              {current?.status === "error" && (
                <span className="flex items-center gap-2 text-destructive">
                  <CircleAlertIcon className="size-3.5" />
                  Unable to save answer
                  <button
                    type="button"
                    className="font-medium underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() =>
                      selectOption(question, current.option)
                    }
                  >
                    Retry
                  </button>
                </span>
              )}
            </div>

            {/* Prev / Next */}
            <div className="flex items-center justify-between border-t pt-4">
              <Button
                variant="outline"
                disabled={index === 0}
                onClick={() => setCurrentIndex(index - 1)}
                className="h-11 px-5"
              >
                <ChevronLeftIcon />
                Previous
              </Button>
              <Button
                variant="outline"
                disabled={index >= total - 1}
                onClick={() => setCurrentIndex(index + 1)}
                className="h-11 px-5"
              >
                Next
                <ChevronRightIcon />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Desktop navigator */}
        <aside className="hidden lg:block">
          <Card className="sticky top-[4.5rem]">
            <CardContent className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Questions
              </p>
              {navigator}
              <div className="space-y-1.5 border-t pt-3 text-xs text-muted-foreground">
                <Legend
                  swatch="border-success bg-success/15 text-success"
                  label={`Answered (${answeredCount})`}
                />
                <Legend
                  swatch=""
                  label={`Unanswered (${total - answeredCount})`}
                />
                <Legend swatch="border-electric ring-1 ring-electric/40" label="Current" />
              </div>
            </CardContent>
          </Card>
        </aside>
      </main>

      {/* Mobile bottom bar */}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-2 px-3">
          <Sheet open={navOpen} onOpenChange={setNavOpen}>
            <SheetTrigger
              render={
                <Button variant="outline" size="sm" className="h-11" />
              }
            >
              <LayoutGridIcon />
              {answeredCount}/{total}
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[70vh]">
              <SheetHeader>
                <SheetTitle>Question navigator</SheetTitle>
              </SheetHeader>
              <div className="overflow-y-auto px-4 pb-6">
                {navigator}
                <div className="mt-4 space-y-1.5 border-t pt-3 text-xs text-muted-foreground">
                  <Legend
                    swatch="border-success bg-success/15 text-success"
                    label={`Answered (${answeredCount})`}
                  />
                  <Legend swatch="" label={`Unanswered (${total - answeredCount})`} />
                  <Legend swatch="border-electric ring-1 ring-electric/40" label="Current" />
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex-1" />

          <Button
            variant="outline"
            size="icon"
            className="h-11 w-11"
            disabled={index === 0}
            onClick={() => setCurrentIndex(index - 1)}
            aria-label="Previous question"
          >
            <ChevronLeftIcon />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-11 w-11"
            disabled={index >= total - 1}
            onClick={() => setCurrentIndex(index + 1)}
            aria-label="Next question"
          >
            <ChevronRightIcon />
          </Button>
          <Button
            size="sm"
            className="h-11 bg-electric text-electric-foreground hover:bg-electric/90"
            disabled={submitMutation.isPending}
            onClick={() => setConfirmOpen(true)}
          >
            {submitMutation.isPending ? (
              <Loader2Icon className="animate-spin" />
            ) : (
              <FlagIcon />
            )}
            Submit
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Submit test?"
        description={`Answered: ${answeredCount} · Unanswered: ${total - answeredCount}. Are you sure you want to submit? This cannot be undone.`}
        confirmLabel={
          submitMutation.isPending ? "Submitting…" : "Submit"
        }
        onConfirm={handleSubmit}
      />

      {/* Proctoring warning — blocking; must be acknowledged */}
      <AlertDialog open={warningOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldAlertIcon className="size-5 text-destructive" />
              Proctoring violation detected
            </AlertDialogTitle>
            <AlertDialogDescription>
              You switched away from the exam or left full
              screen. This is your only warning — if it
              happens again, the test will be submitted
              automatically.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={acknowledgeWarning}>
              I understand — return to exam
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ---------- Sub-components ----------

function TimerPill({
  timeLeft,
  tone,
}: {
  timeLeft: number | null;
  tone: "normal" | "warning" | "critical";
}) {
  const text =
    timeLeft === null ? "--:--" : formatCountdown(timeLeft);

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-sm font-semibold transition-colors",
        tone === "normal" && "border-border text-foreground",
        tone === "warning" &&
          "border-warning/50 bg-warning/10 text-warning",
        tone === "critical" &&
          "border-destructive/60 bg-destructive/10 text-destructive",
      )}
      role="timer"
      aria-live="off"
    >
      <ClockIcon className="size-4" />
      {text}
    </div>
  );
}

function formatCountdown(ms: number) {
  const total = Math.ceil(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function QuestionNavigator({
  questions,
  index,
  answerOf,
  onSelect,
}: {
  questions: AttemptQuestion[];
  index: number;
  answerOf: (q: AttemptQuestion) => AnswerEntry | undefined;
  onSelect: (i: number) => void;
}) {
  return (
    <div className="grid grid-cols-6 gap-2 lg:grid-cols-5">
      {questions.map((q, i) => {
        const answered = !!answerOf(q)?.option;
        const isCurrent = i === index;
        return (
          <button
            key={q.id}
            type="button"
            onClick={() => onSelect(i)}
            aria-current={isCurrent}
            className={cn(
              "flex h-10 items-center justify-center rounded-md border text-sm font-medium numeric transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isCurrent &&
                "border-electric ring-2 ring-electric/40",
              answered
                ? "border-success/50 bg-success/10 text-success"
                : "hover:bg-muted/60",
            )}
          >
            {i + 1}
          </button>
        );
      })}
    </div>
  );
}

function Legend({
  swatch,
  label,
}: {
  swatch: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "inline-block size-4 rounded border",
          swatch || "border-border",
        )}
      />
      {label}
    </div>
  );
}

function ExamSkeleton() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
          <Skeleton className="h-5 w-48" />
          <div className="flex-1" />
          <Skeleton className="h-8 w-20 rounded-full" />
        </div>
      </header>
      <main className="mx-auto grid w-full max-w-5xl flex-1 gap-4 px-4 py-5 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4 rounded-xl border p-6">
          <Skeleton className="h-6 w-2/3" />
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
        <Skeleton className="hidden h-64 rounded-xl lg:block" />
      </main>
    </div>
  );
}

function ExamGate({
  title,
  description,
  minutes,
  total,
  onBegin,
}: {
  title: string;
  description: string | null;
  minutes: number;
  total: number;
  onBegin: () => void;
}) {
  const rules = [
    {
      icon: MaximizeIcon,
      text: "The exam opens in full screen. Do not exit it.",
    },
    {
      icon: ShieldAlertIcon,
      text: "Switching tabs, minimizing the window, or leaving full screen counts as a violation.",
    },
    {
      icon: CircleAlertIcon,
      text: "First violation warns you — the second submits your test automatically.",
    },
    {
      icon: ClockIcon,
      text: `You have ${minutes} minute${minutes === 1 ? "" : "s"}. Answers save as you select them.`,
    },
  ];

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-lg">
        <CardContent className="space-y-6 py-8">
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="numeric">
              {total} question{total === 1 ? "" : "s"}
            </Badge>
            <Badge
              variant="outline"
              className="border-warning/40 bg-warning/10 text-warning"
            >
              <ShieldCheckIcon />
              Proctored exam
            </Badge>
          </div>

          <div className="space-y-1">
            <h1 className="font-heading text-2xl font-bold">
              {title}
            </h1>
            {description && (
              <p className="text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>

          <ul className="space-y-3 rounded-xl border bg-muted/40 p-4">
            {rules.map((rule, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-sm"
              >
                <rule.icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {rule.text}
                </span>
              </li>
            ))}
          </ul>

          <Button
            className="glow-electric w-full bg-electric text-electric-foreground hover:bg-electric/90"
            onClick={onBegin}
          >
            <MaximizeIcon />
            Enter full screen & begin
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}

function ExamEndScreen({
  kind,
}: {
  kind: "submitted" | "expired" | "terminated";
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="flex flex-col items-center gap-4 py-10">
          <div
            className={cn(
              "flex size-14 items-center justify-center rounded-full",
              kind === "submitted" && "bg-success/10",
              kind === "expired" && "bg-warning/10",
              kind === "terminated" && "bg-destructive/10",
            )}
          >
            {kind === "submitted" && (
              <TrophyIcon className="size-7 text-success" />
            )}
            {kind === "expired" && (
              <HourglassIcon className="size-7 text-warning" />
            )}
            {kind === "terminated" && (
              <ShieldAlertIcon className="size-7 text-destructive" />
            )}
          </div>
          <div className="space-y-1">
            <h1 className="font-heading text-xl font-bold">
              {kind === "submitted" &&
                "Test Submitted Successfully"}
              {kind === "expired" && "Time's Up"}
              {kind === "terminated" && "Test Ended"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {kind === "submitted" &&
                "Your responses have been recorded."}
              {kind === "expired" &&
                "The test time has expired. Your saved answers were recorded automatically."}
              {kind === "terminated" &&
                "Your attempt was submitted automatically after repeated proctoring violations."}
            </p>
          </div>
          <Button
            variant="outline"
            render={<Link href="/student" />}
          >
            <RefreshCcwIcon />
            Back to dashboard
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
