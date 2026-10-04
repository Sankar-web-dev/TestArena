import type { ReactNode } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  accent?: "default" | "electric" | "success" | "warning" | "destructive";
  className?: string;
}

const accentClasses = {
  default: "text-foreground",
  electric: "text-electric",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
} as const;

export function StatCard({
  label,
  value,
  hint,
  icon,
  accent = "default",
  className,
}: StatCardProps) {
  return (
    <Card
      size="sm"
      className={cn("card-hover", className)}
    >
      <CardContent className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p
            className={cn(
              "numeric font-heading text-2xl font-semibold tracking-tight",
              accentClasses[accent],
            )}
          >
            {value}
          </p>
          {hint && (
            <p className="text-xs text-muted-foreground">
              {hint}
            </p>
          )}
        </div>
        {icon && (
          <div className="rounded-md bg-muted p-2 text-muted-foreground [&_svg]:size-4">
            {icon}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
