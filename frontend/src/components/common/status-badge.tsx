import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  AttemptStatus,
  QuestionStatus,
  TestStatus,
} from "@/lib/api/types";

type Status = TestStatus | QuestionStatus | AttemptStatus;

const statusStyles: Record<Status, string> = {
  // TestStatus
  DRAFT: "bg-muted text-muted-foreground border-transparent",
  READY: "bg-info/10 text-info border-info/20",
  PUBLISHED:
    "bg-electric/10 text-electric border-electric/25",
  LIVE: "bg-live/10 text-live border-live/25",
  ENDED: "bg-muted text-muted-foreground border-transparent",
  // QuestionStatus
  VERIFIED:
    "bg-success/10 text-success border-success/25",
  REJECTED:
    "bg-destructive/10 text-destructive border-destructive/25",
  // AttemptStatus
  IN_PROGRESS:
    "bg-electric/10 text-electric border-electric/25",
  SUBMITTED:
    "bg-success/10 text-success border-success/25",
  EXPIRED: "bg-warning/10 text-warning border-warning/25",
};

const liveStatuses: Status[] = ["LIVE", "IN_PROGRESS"];

export function StatusBadge({
  status,
  className,
}: {
  status: Status;
  className?: string;
}) {
  const isLive = liveStatuses.includes(status);

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium tracking-wide",
        statusStyles[status],
        className,
      )}
    >
      {isLive && (
        <span className="relative flex size-1.5">
          <span className="animate-pulse-dot absolute inline-flex size-full rounded-full bg-current" />
        </span>
      )}
      {status.replace(/_/g, " ")}
    </Badge>
  );
}
