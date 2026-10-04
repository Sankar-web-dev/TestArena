"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2Icon,
  CircleAlertIcon,
  DownloadIcon,
  FileSpreadsheetIcon,
  Loader2Icon,
  UploadIcon,
  XIcon,
} from "lucide-react";

import { useImportQuestions } from "@/hooks/mutations/use-test-mutations";
import { API_URL } from "@/lib/api/client";
import type { ImportQuestionsResponse } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface QuestionImportProps {
  testId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function QuestionImport({
  testId,
  open,
  onOpenChange,
}: QuestionImportProps) {
  const importMutation = useImportQuestions(testId);

  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] =
    useState<ImportQuestionsResponse | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setFile(null);
    setError(null);
    setResult(null);
    setDragging(false);
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  function selectFile(candidate: File | undefined | null) {
    setError(null);
    setResult(null);

    if (!candidate) return;

    if (!candidate.name.toLowerCase().endsWith(".xlsx")) {
      setError("Only .xlsx files are supported");
      setFile(null);
      return;
    }

    if (candidate.size === 0) {
      setError("The selected file is empty");
      setFile(null);
      return;
    }

    setFile(candidate);
  }

  async function handleUpload() {
    if (!file) return;
    setError(null);

    try {
      const response = await importMutation.mutateAsync(file);
      setResult(response);
      toast.success(
        `Imported ${response.count} question${response.count === 1 ? "" : "s"}`,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Import failed. Check the file format and try again.",
      );
    }
  }

  const isPending = importMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import questions</DialogTitle>
          <DialogDescription>
            Upload an Excel workbook (.xlsx). Questions are imported
            as Drafts for review.
            <span className="mt-1 block text-xs">
              Columns: questionText, optionA–D, correctOption (A–D),
              marks
            </span>
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-4">
            <Alert className="border-success/40 bg-success/5 text-foreground">
              <CheckCircle2Icon className="text-success" />
              <AlertDescription>
                <span className="numeric font-semibold">
                  {result.count}
                </span>{" "}
                question{result.count === 1 ? "" : "s"} imported as
                Draft — verify them before publishing.
              </AlertDescription>
            </Alert>
            <DialogFooter>
              <Button onClick={() => handleOpenChange(false)}>
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <CircleAlertIcon />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Drop zone / file picker */}
            <button
              type="button"
              disabled={isPending}
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                selectFile(e.dataTransfer.files.item(0));
              }}
              className={cn(
                "flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors",
                dragging
                  ? "border-electric bg-electric/5"
                  : "border-border hover:border-muted-foreground/40 hover:bg-muted/40",
                isPending && "cursor-not-allowed opacity-60",
              )}
            >
              <UploadIcon className="size-6 text-muted-foreground" />
              <p className="text-sm font-medium">
                {dragging
                  ? "Drop the file here"
                  : "Drag & drop your .xlsx file"}
              </p>
              <p className="text-xs text-muted-foreground">
                or click to browse — .xlsx only
              </p>
            </button>

            <p className="text-center text-xs text-muted-foreground">
              No file yet?{" "}
              <a
                href={`${API_URL}/api/tests/questions/template`}
                download
                className="inline-flex items-center gap-1 font-medium text-electric underline-offset-2 hover:underline"
              >
                <DownloadIcon className="size-3" />
                Download the template
              </a>
            </p>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              onChange={(e) => {
                selectFile(e.target.files?.item(0));
                e.target.value = "";
              }}
            />

            {/* Selected file */}
            {file && (
              <div className="flex items-center gap-3 rounded-md border bg-muted/30 px-3 py-2.5">
                <FileSpreadsheetIcon className="size-5 shrink-0 text-success" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {file.name}
                  </p>
                  <p className="numeric text-xs text-muted-foreground">
                    {formatBytes(file.size)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={isPending}
                  onClick={() => setFile(null)}
                  aria-label="Remove file"
                >
                  <XIcon />
                </Button>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                onClick={handleUpload}
                disabled={!file || isPending}
                className="bg-electric text-electric-foreground hover:bg-electric/90"
              >
                {isPending && <Loader2Icon className="animate-spin" />}
                {isPending ? "Importing…" : "Upload & import"}
              </Button>
              <Button
                variant="ghost"
                disabled={isPending}
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
