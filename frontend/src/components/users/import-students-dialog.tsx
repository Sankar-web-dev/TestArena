"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2Icon,
  CircleAlertIcon,
  DownloadIcon,
  FileSpreadsheetIcon,
  Loader2Icon,
  UploadCloudIcon,
} from "lucide-react";

import { ApiError } from "@/lib/api/client";
import { STUDENT_IMPORT_TEMPLATE_URL } from "@/lib/api/users";
import type {
  ImportStudentsPreview,
  ImportStudentsResult,
} from "@/lib/api/types";
import { useImportStudents } from "@/hooks/mutations/use-user-mutations";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Step = "pick" | "validating" | "preview" | "importing" | "done";

const ACCEPTED = ".xlsx,.xls";

export function ImportStudentsDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("pick");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] =
    useState<ImportStudentsPreview | null>(null);
  const [result, setResult] =
    useState<ImportStudentsResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const importMutation = useImportStudents();

  function reset() {
    setStep("pick");
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setDragging(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleFile(next: File | null) {
    if (!next) return;
    if (!ACCEPTED.split(",").some((ext) => next.name.toLowerCase().endsWith(ext))) {
      setError("Please choose an .xlsx or .xls file");
      return;
    }
    setError(null);
    setFile(next);
  }

  function handleValidate() {
    if (!file) return;
    setStep("validating");
    importMutation.mutate(
      { file, dryRun: true },
      {
        onSuccess: (data) => {
          setPreview(data as ImportStudentsPreview);
          setStep("preview");
        },
        onError: (err) => {
          setError(
            err instanceof ApiError
              ? err.message
              : "Could not validate the file.",
          );
          setStep("pick");
        },
      },
    );
  }

  function handleImport() {
    if (!file) return;
    setStep("importing");
    importMutation.mutate(
      { file, dryRun: false },
      {
        onSuccess: (data) => {
          const res = data as ImportStudentsResult;
          setResult(res);
          setStep("done");
          if (res.failed === 0) {
            toast.success(
              `${res.created} student${res.created === 1 ? "" : "s"} imported.`,
            );
          } else {
            toast.warning(
              `${res.created} imported, ${res.failed} failed.`,
            );
          }
        },
        onError: (err) => {
          setError(
            err instanceof ApiError
              ? err.message
              : "Import failed. Please try again.",
          );
          setStep("preview");
        },
      },
    );
  }

  const busy = step === "validating" || step === "importing";

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o && !busy) {
          onClose();
          reset();
        }
      }}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Students</DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-2">
            <span>
              Bulk-create student accounts from Excel —
              every account is created as{" "}
            </span>
            <Badge
              variant="outline"
              className="border-electric/30 bg-electric/10 text-electric"
            >
              Student
            </Badge>
            <Button
              variant="link"
              size="xs"
              className="px-0"
              render={
                <a
                  href={STUDENT_IMPORT_TEMPLATE_URL}
                  download
                />
              }
            >
              <DownloadIcon />
              Download template
            </Button>
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <CircleAlertIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* ---- file picker ---- */}
        {(step === "pick" || step === "validating") && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                handleFile(e.dataTransfer.files?.[0] ?? null);
              }}
              className={cn(
                "flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                dragging
                  ? "border-electric bg-electric/5"
                  : "border-border hover:border-muted-foreground/40 hover:bg-muted/40",
              )}
            >
              <UploadCloudIcon className="size-8 text-muted-foreground" />
              <p className="text-sm font-medium">
                Drag & drop your Excel file
              </p>
              <p className="text-xs text-muted-foreground">
                or click to browse — columns: name, email
              </p>
            </button>

            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED}
              className="sr-only"
              onChange={(e) =>
                handleFile(e.target.files?.[0] ?? null)
              }
              aria-label="Choose Excel file"
            />

            {file && (
              <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 px-3 py-2">
                <p className="flex min-w-0 items-center gap-2 text-sm">
                  <FileSpreadsheetIcon className="size-4 shrink-0 text-success" />
                  <span className="truncate">{file.name}</span>
                  <span className="numeric shrink-0 text-xs text-muted-foreground">
                    ({Math.ceil(file.size / 1024)} KB)
                  </span>
                </p>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => {
                    setFile(null);
                    if (inputRef.current)
                      inputRef.current.value = "";
                  }}
                >
                  Remove
                </Button>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  onClose();
                  reset();
                }}
              >
                Cancel
              </Button>
              <Button
                disabled={!file || busy}
                onClick={handleValidate}
              >
                {step === "validating" && (
                  <Loader2Icon className="animate-spin" />
                )}
                Validate
              </Button>
            </div>
          </div>
        )}

        {/* ---- preview ---- */}
        {(step === "preview" || step === "importing") &&
          preview && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="secondary" className="numeric">
                  {preview.totalRows} rows
                </Badge>
                <Badge className="numeric border-success/30 bg-success/10 text-success">
                  {preview.valid} valid
                </Badge>
                {preview.invalid > 0 && (
                  <Badge className="numeric border-destructive/30 bg-destructive/10 text-destructive">
                    {preview.invalid} invalid
                  </Badge>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                Each student signs in with their email and the
                default password{" "}
                <span className="font-mono font-medium text-foreground">
                  Saec@1234
                </span>{" "}
                — they can change it and their username later.
              </p>

              <div className="max-h-64 overflow-y-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-14">Row</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="w-40">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.rows.map((row) => (
                      <TableRow key={row.row}>
                        <TableCell className="numeric">
                          {row.row}
                        </TableCell>
                        <TableCell className="max-w-40 truncate">
                          {row.name || "—"}
                        </TableCell>
                        <TableCell className="max-w-52 truncate">
                          {row.email || "—"}
                        </TableCell>
                        <TableCell>
                          {row.valid ? (
                            <span className="flex items-center gap-1 text-xs font-medium text-success">
                              <CheckCircle2Icon className="size-3.5" />
                              Ready
                            </span>
                          ) : (
                            <span
                              className="text-xs text-destructive"
                              title={row.message}
                            >
                              {row.message}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={reset}
                >
                  Back
                </Button>
                <Button
                  disabled={preview.valid === 0 || busy}
                  onClick={handleImport}
                >
                  {step === "importing" && (
                    <Loader2Icon className="animate-spin" />
                  )}
                  Import {preview.valid} student
                  {preview.valid === 1 ? "" : "s"}
                </Button>
              </div>
            </div>
          )}

        {/* ---- result ---- */}
        {step === "done" && result && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge className="numeric border-success/30 bg-success/10 text-success">
                {result.created} created
              </Badge>
              {result.failed > 0 && (
                <Badge className="numeric border-destructive/30 bg-destructive/10 text-destructive">
                  {result.failed} failed
                </Badge>
              )}
              <Badge variant="secondary" className="numeric">
                {result.totalRows} total rows
              </Badge>
            </div>

            {result.errors.length > 0 && (
              <div className="max-h-48 space-y-1.5 overflow-y-auto rounded-lg border p-3">
                {result.errors.map((err, i) => (
                  <p
                    key={i}
                    className="flex items-baseline gap-2 text-xs"
                  >
                    <span className="numeric shrink-0 font-medium text-destructive">
                      Row {err.row}
                    </span>
                    <span className="text-muted-foreground">
                      {err.message}
                    </span>
                  </p>
                ))}
              </div>
            )}

            <div className="flex justify-end">
              <Button
                onClick={() => {
                  onClose();
                  reset();
                }}
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
