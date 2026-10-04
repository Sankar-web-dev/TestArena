"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";

import {
  useCreateQuestion,
  useUpdateQuestion,
} from "@/hooks/mutations/use-test-mutations";
import { ApiError } from "@/lib/api/client";
import type { Question } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const OPTION_KEYS = ["A", "B", "C", "D"] as const;

interface QuestionFormProps {
  testId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Provided in edit mode */
  question?: Question;
}

interface FieldErrors {
  questionText?: string;
  marks?: string;
  options?: string;
  correctOption?: string;
}

export function QuestionForm({
  testId,
  open,
  onOpenChange,
  question,
}: QuestionFormProps) {
  const isEdit = !!question;

  const createMutation = useCreateQuestion(testId);
  const updateMutation = useUpdateQuestion(testId);
  const isPending =
    createMutation.isPending || updateMutation.isPending;

  const [questionText, setQuestionText] = useState(
    question?.questionText ?? "",
  );
  const [marks, setMarks] = useState(
    question ? String(question.marks) : "1",
  );
  const [options, setOptions] = useState<string[]>(() =>
    OPTION_KEYS.map(
      (key) =>
        question?.options.find((o) => o.optionKey === key)
          ?.optionText ?? "",
    ),
  );
  const [correctOption, setCorrectOption] = useState(
    question?.correctOption ?? "",
  );
  const [errors, setErrors] = useState<FieldErrors>({});

  function setOptionAt(index: number, value: string) {
    setOptions((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  function validate(): boolean {
    const next: FieldErrors = {};

    if (!questionText.trim()) {
      next.questionText = "Question text is required";
    }

    const marksNum = Number(marks);
    if (!marks || !Number.isInteger(marksNum) || marksNum < 1) {
      next.marks = "Marks must be a whole number ≥ 1";
    }

    if (options.some((o) => !o.trim())) {
      next.options = "All four options are required";
    }

    if (!OPTION_KEYS.includes(correctOption as (typeof OPTION_KEYS)[number])) {
      next.correctOption = "Select the correct option";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const input = {
      questionText: questionText.trim(),
      marks: Number(marks),
      correctOption,
      options: OPTION_KEYS.map((optionKey, i) => ({
        optionKey,
        optionText: options[i].trim(),
      })),
    };

    try {
      if (isEdit && question) {
        await updateMutation.mutateAsync({
          questionId: question.id,
          input,
        });
        toast.success("Question updated", {
          description: "Its status was reset to Draft.",
        });
      } else {
        await createMutation.mutateAsync(input);
        toast.success("Question added");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Save failed",
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit question" : "New question"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Saving changes resets this question to Draft — it will need re-verification."
              : "Add a question to this test. It starts as a Draft."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div className="space-y-2">
            <Label htmlFor="q-text">Question</Label>
            <Textarea
              id="q-text"
              placeholder="Enter the question text"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              aria-invalid={!!errors.questionText}
              disabled={isPending}
              rows={3}
              autoFocus
            />
            {errors.questionText && (
              <p className="text-xs text-destructive">
                {errors.questionText}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Tip: wrap code in ```lang blocks (e.g. ```c) for
              syntax highlighting, `code` for inline.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="q-marks">Marks</Label>
            <Input
              id="q-marks"
              type="number"
              min={1}
              step={1}
              value={marks}
              onChange={(e) => setMarks(e.target.value)}
              aria-invalid={!!errors.marks}
              disabled={isPending}
              className="numeric w-28"
            />
            {errors.marks && (
              <p className="text-xs text-destructive">{errors.marks}</p>
            )}
          </div>

          <fieldset className="space-y-2">
            <Label className="sr-only">Answer options</Label>
            <div className="space-y-2">
              {OPTION_KEYS.map((key, i) => (
                <div key={key} className="flex items-start gap-2">
                  <span
                    className={cn(
                      "mt-1 flex size-8 shrink-0 items-center justify-center rounded-md border text-xs font-semibold",
                      correctOption === key
                        ? "border-success bg-success/10 text-success"
                        : "text-muted-foreground",
                    )}
                  >
                    {key}
                  </span>
                  <Textarea
                    placeholder={`Option ${key}`}
                    value={options[i]}
                    onChange={(e) => setOptionAt(i, e.target.value)}
                    disabled={isPending}
                    aria-label={`Option ${key}`}
                    aria-invalid={
                      !!errors.options && !options[i].trim()
                    }
                    rows={1}
                    className={cn(
                      "min-h-10 field-sizing-content resize-none",
                      /\n|```|`/.test(options[i]) && "font-mono text-sm",
                    )}
                  />
                </div>
              ))}
            </div>
            {errors.options && (
              <p className="text-xs text-destructive">{errors.options}</p>
            )}
          </fieldset>

          <fieldset className="space-y-2">
            <Label>Correct option</Label>
            <RadioGroup
              value={correctOption}
              onValueChange={setCorrectOption}
              className="flex flex-wrap gap-3"
              disabled={isPending}
            >
              {OPTION_KEYS.map((key) => (
                <Label
                  key={key}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
                    correctOption === key
                      ? "border-success bg-success/10 text-success"
                      : "hover:bg-muted/60",
                  )}
                >
                  <RadioGroupItem value={key} aria-label={`Option ${key}`} />
                  {key}
                </Label>
              ))}
            </RadioGroup>
            {errors.correctOption && (
              <p className="text-xs text-destructive">
                {errors.correctOption}
              </p>
            )}
          </fieldset>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="submit"
              disabled={isPending}
              className="bg-electric text-electric-foreground hover:bg-electric/90"
            >
              {isPending && <Loader2Icon className="animate-spin" />}
              {isPending
                ? "Saving…"
                : isEdit
                  ? "Save changes"
                  : "Add question"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
