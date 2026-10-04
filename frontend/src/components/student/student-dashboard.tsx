"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  CalendarIcon,
  CircleAlertIcon,
  ClockIcon,
  KeyRoundIcon,
  ListChecksIcon,
  Loader2Icon,
  LogInIcon,
  RefreshCcwIcon,
  TrophyIcon,
  ZapIcon,
} from "lucide-react";

import { useAvailableTests } from "@/hooks/queries/use-attempt";
import { useEnterTest } from "@/hooks/mutations/use-attempt-mutations";
import { ApiError } from "@/lib/api/client";
import type { AvailableTest } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface StudentDashboardProps {
  userName: string;
}

export function StudentDashboard({ userName }: StudentDashboardProps) {
  const { data, isPending, isError, error, refetch } =
    useAvailableTests();
  const [enterTarget, setEnterTarget] =
    useState<AvailableTest | null>(null);

  const tests = data ?? [];

  return (
    <div className="space-y-8">
      {/* Competition hero */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-card via-card to-electric/5 px-6 py-8 sm:px-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(600px circle at 85% 10%, var(--electric) / 0.12, transparent 55%), radial-gradient(400px circle at 10% 100%, var(--chart-2) / 0.1, transparent 50%)",
          }}
        />
        <div className="relative space-y-1.5">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-electric">
            <ZapIcon className="size-3.5" />
            Competition Arena
          </p>
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            Ready to compete, {userName}?
          </h1>
          <p className="max-w-lg text-sm text-muted-foreground">
            Pick an exam below, enter the password from your
            proctor, and race the clock.
          </p>
        </div>
      </div>

      {/* Content */}
      {isPending ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <CircleAlertIcon className="size-8 text-destructive" />
            <div>
              <p className="font-medium">Couldn&apos;t load tests</p>
              <p className="text-sm text-muted-foreground">
                {error instanceof ApiError
                  ? error.message
                  : "Something went wrong. Please try again."}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refetch()}
            >
              <RefreshCcwIcon />
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : tests.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <TrophyIcon className="size-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-heading font-semibold">
                No tests available right now
              </p>
              <p className="text-sm text-muted-foreground">
                New exams will appear here when your
                administrator publishes them.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refetch()}
            >
              <RefreshCcwIcon />
              Refresh
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tests.map((test) => (
            <TestCard
              key={test.id}
              test={test}
              onEnter={() => setEnterTarget(test)}
            />
          ))}
        </div>
      )}

      <EnterTestDialog
        test={enterTarget}
        onClose={() => setEnterTarget(null)}
      />
    </div>
  );
}

// ---------- Test card ----------

type TestState =
  | "attended"
  | "in-progress"
  | "ended"
  | "scheduled"
  | "live";

function testState(test: AvailableTest): TestState {
  const now = Date.now();
  const attempt = test.attempt;
  if (
    attempt &&
    (attempt.status === "SUBMITTED" ||
      attempt.status === "EXPIRED")
  ) {
    return "attended";
  }
  if (attempt) return "in-progress";
  if (
    test.endTime &&
    new Date(test.endTime).getTime() <= now
  ) {
    return "ended";
  }
  if (
    test.startTime &&
    new Date(test.startTime).getTime() > now
  ) {
    return "scheduled";
  }
  return "live";
}

const STATE_META: Record<
  TestState,
  { label: string; button: string; enterable: boolean }
> = {
  attended: { label: "Attended", button: "Attended", enterable: false },
  "in-progress": {
    label: "In progress",
    button: "Resume",
    enterable: true,
  },
  ended: { label: "Ended", button: "Ended", enterable: false },
  scheduled: {
    label: "Scheduled",
    button: "Not open yet",
    enterable: false,
  },
  live: { label: "Live now", button: "Enter Test", enterable: true },
};

function TestCard({
  test,
  onEnter,
}: {
  test: AvailableTest;
  onEnter: () => void;
}) {
  const state = testState(test);
  const meta = STATE_META[state];
  const live = state === "live" || state === "in-progress";

  return (
    <Card className="group relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:border-electric/40 hover:shadow-[0_8px_30px_-12px_var(--electric)]">
      {/* accent line */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-electric/80 via-electric/40 to-transparent"
      />
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h2 className="font-heading font-semibold leading-snug">
              {test.title}
            </h2>
            <Badge
              variant={live ? "default" : "secondary"}
              className={
                live
                  ? "shrink-0 bg-success text-white"
                  : "shrink-0"
              }
            >
              {live && (
                <span className="mr-1 size-1.5 animate-pulse rounded-full bg-white" />
              )}
              {meta.label}
            </Badge>
          </div>
          {test.description && (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {test.description}
            </p>
          )}
        </div>

        <dl className="grid grid-cols-2 gap-y-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <ClockIcon className="size-3.5" />
            <span className="numeric">{test.duration} min</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ListChecksIcon className="size-3.5" />
            <span className="numeric">
              {test._count?.questions ?? 0} questions
            </span>
          </div>
          {(test.startTime || test.endTime) && (
            <div className="col-span-2 flex items-center gap-1.5">
              <CalendarIcon className="size-3.5" />
              <span className="numeric">
                {test.startTime
                  ? format(new Date(test.startTime), "MMM d, HH:mm")
                  : "Anytime"}
                {" → "}
                {test.endTime
                  ? format(new Date(test.endTime), "MMM d, HH:mm")
                  : "Open"}
              </span>
            </div>
          )}
        </dl>

        <Button
          className="glow-electric w-full bg-electric text-electric-foreground transition-all hover:bg-electric/90"
          onClick={onEnter}
          disabled={!meta.enterable}
        >
          <LogInIcon />
          {meta.button}
        </Button>
      </CardContent>
    </Card>
  );
}

// ---------- Enter dialog ----------

function EnterTestDialog({
  test,
  onClose,
}: {
  test: AvailableTest | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const enterMutation = useEnterTest();
  const resuming = test?.attempt?.status === "IN_PROGRESS";

  function handleEnter() {
    enterMutation.mutate(
      resuming
        ? { testId: test!.id }
        : { testId: test!.id, password },
      {
        onSuccess: (data) => {
          toast.success(
            resuming
              ? "Resuming your exam"
              : "Exam started — good luck!",
          );
          onClose();
          router.push(`/student/attempt/${data.attemptId}`);
        },
        onError: (err) => {
          setError(
            err instanceof ApiError
              ? err.message
              : "Could not start the exam. Please try again.",
          );
        },
      },
    );
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      setPassword("");
      setError(null);
      onClose();
    }
  }

  return (
    <Dialog open={!!test} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {resuming ? "Resume" : "Enter"} — {test?.title}
          </DialogTitle>
          <DialogDescription>
            {test && (
              <span className="space-y-1">
                <span className="block">
                  <span className="numeric">{test.duration} min</span>
                  {" · "}
                  <span className="numeric">
                    {test._count?.questions ?? 0} questions
                  </span>
                  {" — the timer starts when you enter."}
                </span>
                <span className="block">
                  {test.startTime || test.endTime
                    ? `Available ${test.startTime ? format(new Date(test.startTime), "MMM d, HH:mm") : "now"} → ${test.endTime ? format(new Date(test.endTime), "MMM d, HH:mm") : "open"}`
                    : "Available anytime while published"}
                </span>
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (resuming || password) {
              setError(null);
              handleEnter();
            } else {
              setError("Enter the test password");
            }
          }}
          noValidate
        >
          {error && (
            <Alert variant="destructive">
              <CircleAlertIcon />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!resuming && (
            <div className="space-y-2">
              <Label htmlFor="enter-password">
                Test password
              </Label>
              <div className="relative">
                <KeyRoundIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="enter-password"
                  type="password"
                  placeholder="Provided by your proctor"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={enterMutation.isPending}
                  className="h-12 pl-9 text-base"
                  autoComplete="off"
                  autoFocus
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="submit"
              disabled={enterMutation.isPending}
              className="h-12 w-full bg-electric text-base text-electric-foreground hover:bg-electric/90 sm:h-10 sm:w-auto sm:text-sm"
            >
              {enterMutation.isPending && (
                <Loader2Icon className="animate-spin" />
              )}
              {enterMutation.isPending
                ? resuming
                  ? "Resuming…"
                  : "Starting…"
                : resuming
                  ? "Resume exam"
                  : "Start exam"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={enterMutation.isPending}
              onClick={() => handleOpenChange(false)}
              className="h-12 sm:h-10"
            >
              Cancel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
