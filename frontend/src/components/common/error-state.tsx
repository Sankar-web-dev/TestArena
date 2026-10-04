import type { ReactNode } from "react";
import { CircleAlertIcon } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
  action?: ReactNode;
  className?: string;
}

export function ErrorState({
  error,
  onRetry,
  action,
  className,
}: ErrorStateProps) {
  const message =
    error instanceof ApiError
      ? error.message
      : error instanceof Error
        ? error.message
        : "Something went wrong";

  return (
    <Alert
      variant="destructive"
      className={cn("items-start", className)}
    >
      <CircleAlertIcon />
      <AlertTitle>Unable to load data</AlertTitle>
      <AlertDescription className="flex flex-col gap-3">
        <span>{message}</span>
        {(onRetry || action) && (
          <div className="flex items-center gap-2">
            {onRetry && (
              <Button
                size="sm"
                variant="outline"
                onClick={onRetry}
              >
                Retry
              </Button>
            )}
            {action}
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}
