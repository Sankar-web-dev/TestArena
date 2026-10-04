"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeftIcon,
  BanIcon,
  CheckCircle2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PencilIcon,
} from "lucide-react";

import type { Question } from "@/lib/api/types";
import { StatusBadge } from "@/components/common/status-badge";
import { RichText } from "@/components/common/rich-text";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface VerificationWorkspaceProps {
  questions: Question[];
  onExit: () => void;
  onVerify: (question: Question) => Promise<boolean>;
  onReject: (question: Question) => Promise<boolean>;
  onEdit: (question: Question) => void;
  busy: boolean;
  /** Suppress keyboard shortcuts (e.g. while an editor dialog is open) */
  shortcutsDisabled?: boolean;
}

export function VerificationWorkspace({
  questions,
  onExit,
  onVerify,
  onReject,
  onEdit,
  busy,
  shortcutsDisabled,
}: VerificationWorkspaceProps) {
  const [index, setIndex] = useState(0);

  const total = questions.length;
  const clamped = Math.min(index, Math.max(0, total - 1));
  const question = questions[clamped];

  const verified = questions.filter(
    (q) => q.status === "VERIFIED",
  ).length;
  const progress = total > 0 ? (verified / total) * 100 : 0;

  function goPrev() {
    setIndex((i) => Math.max(0, i - 1));
  }

  function goNext() {
    setIndex((i) => Math.min(total - 1, i + 1));
  }

  async function handleVerify() {
    if (!question || busy) return;
    const ok = await onVerify(question);
    if (ok) goNext();
  }

  async function handleReject() {
    if (!question || busy) return;
    const ok = await onReject(question);
    if (ok) goNext();
  }

  // Keyboard shortcuts: ←/→ navigate, V verify, R reject, E edit
  useEffect(() => {
    if (shortcutsDisabled || !question) return;

    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          goPrev();
          break;
        case "ArrowRight":
          e.preventDefault();
          goNext();
          break;
        case "v":
        case "V":
          void handleVerify();
          break;
        case "r":
        case "R":
          void handleReject();
          break;
        case "e":
        case "E":
          if (question) onEdit(question);
          break;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clamped, question?.id, busy, shortcutsDisabled]);

  if (!question) return null;

  return (
    <div className="space-y-4">
      {/* Workspace header + progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 text-muted-foreground"
            onClick={onExit}
          >
            <ArrowLeftIcon />
            Back to list
          </Button>
          <p className="numeric text-sm font-medium">
            <span className="text-success">{verified}</span>
            <span className="text-muted-foreground">
              {" "}
              / {total} verified
            </span>
          </p>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {/* Current question */}
      <Card key={question.id} className="animate-fade-in-up">
        <CardContent className="space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="accent-line flex size-7 shrink-0 items-center justify-center rounded-md bg-muted pl-0 text-xs font-bold numeric">
                {clamped + 1}
              </span>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Question {clamped + 1} of {total}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="numeric">
                {question.marks}{" "}
                {question.marks === 1 ? "mark" : "marks"}
              </Badge>
              <StatusBadge status={question.status} />
            </div>
          </div>

          <RichText
            text={question.questionText}
            className="text-base font-medium leading-relaxed"
          />

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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
                      "flex items-center gap-2 rounded-md border px-3 py-2.5 text-sm",
                      isCorrect
                        ? "border-success/40 bg-success/5"
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

          <p className="text-xs text-muted-foreground">
            Correct answer:{" "}
            <span className="font-semibold text-success">
              {question.correctOption}
            </span>
          </p>

          {/* Actions */}
          <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center">
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => onEdit(question)}
              className="w-full sm:w-auto"
            >
              <PencilIcon />
              Edit
              <kbd className="hidden rounded border px-1 font-mono text-[10px] text-muted-foreground sm:inline">
                E
              </kbd>
            </Button>
            <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => void handleReject()}
                className="w-full border-warning/40 text-warning hover:bg-warning/10 sm:w-auto"
              >
                <BanIcon />
                Reject
                <kbd className="hidden rounded border px-1 font-mono text-[10px] sm:inline">
                  R
                </kbd>
              </Button>
              <Button
                size="sm"
                disabled={busy}
                onClick={() => void handleVerify()}
                className="w-full bg-success text-white hover:bg-success/90 sm:w-auto"
              >
                <CheckCircle2Icon />
                Verify
                <kbd className="hidden rounded border border-white/30 px-1 font-mono text-[10px] sm:inline">
                  V
                </kbd>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          disabled={clamped === 0}
          onClick={goPrev}
        >
          <ChevronLeftIcon />
          Previous
        </Button>
        <p className="numeric hidden text-xs text-muted-foreground sm:block">
          ← → to navigate
        </p>
        <Button
          variant="outline"
          size="sm"
          disabled={clamped >= total - 1}
          onClick={goNext}
        >
          Next
          <ChevronRightIcon />
        </Button>
      </div>
    </div>
  );
}
