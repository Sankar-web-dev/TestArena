"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  EyeIcon,
  EyeOffIcon,
  Loader2Icon,
} from "lucide-react";

import {
  useCreateTest,
  useUpdateTest,
} from "@/hooks/mutations/use-test-mutations";
import type {
  AdminTest,
  CreateTestInput,
  UpdateTestInput,
} from "@/lib/api/types";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";
import { CircleAlertIcon } from "lucide-react";
import { DateTimePicker } from "@/components/common/date-time-picker";

interface TestFormProps {
  /** e.g. "/admin/tests" or "/teacher/tests" */
  basePath: string;
  /** When provided, renders edit mode */
  initialTest?: AdminTest;
}

interface FieldErrors {
  title?: string;
  duration?: string;
  password?: string;
  endTime?: string;
}

export function TestForm({ basePath, initialTest }: TestFormProps) {
  const router = useRouter();
  const isEdit = !!initialTest;

  const createMutation = useCreateTest();
  const updateMutation = useUpdateTest();
  const isPending =
    createMutation.isPending || updateMutation.isPending;

  const [title, setTitle] = useState(initialTest?.title ?? "");
  const [description, setDescription] = useState(
    initialTest?.description ?? "",
  );
  const [duration, setDuration] = useState(
    initialTest ? String(initialTest.duration) : "",
  );
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [startTime, setStartTime] = useState<Date | undefined>(
    initialTest?.startTime
      ? new Date(initialTest.startTime)
      : undefined,
  );
  const [endTime, setEndTime] = useState<Date | undefined>(
    initialTest?.endTime
      ? new Date(initialTest.endTime)
      : undefined,
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  function validate(): boolean {
    const next: FieldErrors = {};

    if (!title.trim()) {
      next.title = "Title is required";
    }

    const durationNum = Number(duration);
    if (!duration || !Number.isInteger(durationNum) || durationNum < 1) {
      next.duration = "Enter a whole number of minutes (min 1)";
    }

    if (!isEdit && !password) {
      next.password = "An access password is required";
    }

    if (startTime && endTime && endTime <= startTime) {
      next.endTime = "End time must be after start time";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!validate()) return;

    try {
      if (isEdit && initialTest) {
        const input: UpdateTestInput = {
          title: title.trim(),
          description: description.trim() || undefined,
          duration: Number(duration),
          startTime: startTime ? startTime.toISOString() : null,
          endTime: endTime ? endTime.toISOString() : null,
        };
        if (password) {
          input.password = password;
        }

        await updateMutation.mutateAsync({
          testId: initialTest.id,
          input,
        });
        toast.success("Test updated");
      } else {
        const input: CreateTestInput = {
          title: title.trim(),
          description: description.trim() || undefined,
          duration: Number(duration),
          password,
          ...(startTime && { startTime: startTime.toISOString() }),
          ...(endTime && { endTime: endTime.toISOString() }),
        };

        await createMutation.mutateAsync(input);
        toast.success("Test created", {
          description: "Add questions, then publish when ready.",
        });
      }

      router.push(basePath);
      router.refresh();
    } catch (err) {
      setFormError(
        err instanceof ApiError
          ? err.message
          : "Something went wrong. Please try again.",
      );
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {formError && (
            <Alert variant="destructive">
              <CircleAlertIcon />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="test-title">Title</Label>
            <Input
              id="test-title"
              placeholder="e.g. Data Structures Midterm"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-invalid={!!errors.title}
              disabled={isPending}
              autoFocus
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="test-description">
              Description{" "}
              <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="test-description"
              placeholder="Brief instructions or topics covered"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isPending}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="test-duration">Duration (minutes)</Label>
              <Input
                id="test-duration"
                type="number"
                min={1}
                step={1}
                placeholder="60"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                aria-invalid={!!errors.duration}
                disabled={isPending}
                className="numeric"
              />
              {errors.duration && (
                <p className="text-xs text-destructive">
                  {errors.duration}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="test-password">
                {isEdit ? "New password" : "Access password"}
                {isEdit && (
                  <span className="text-muted-foreground">
                    {" "}
                    (blank keeps current)
                  </span>
                )}
              </Label>
              <div className="relative">
                <Input
                  id="test-password"
                  type={showPassword ? "text" : "password"}
                  placeholder={
                    isEdit ? "••••••••" : "Required for student entry"
                  }
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={!!errors.password}
                  disabled={isPending}
                  className="pr-10"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOffIcon className="size-4" />
                  ) : (
                    <EyeIcon className="size-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">
                  {errors.password}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Start time (optional)</Label>
              <DateTimePicker
                value={startTime}
                onChange={setStartTime}
                placeholder="No scheduled start"
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label>End time (optional)</Label>
              <DateTimePicker
                value={endTime}
                onChange={setEndTime}
                placeholder="No scheduled end"
                disabled={isPending}
                aria-invalid={!!errors.endTime}
              />
              {errors.endTime && (
                <p className="text-xs text-destructive">
                  {errors.endTime}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              type="submit"
              disabled={isPending}
              className="bg-electric text-electric-foreground hover:bg-electric/90"
            >
              {isPending && <Loader2Icon className="animate-spin" />}
              {isPending
                ? isEdit
                  ? "Saving…"
                  : "Creating…"
                : isEdit
                  ? "Save changes"
                  : "Create test"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={isPending}
              onClick={() => router.push(basePath)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
