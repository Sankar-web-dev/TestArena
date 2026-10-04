import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
}

/**
 * Consistent page-width wrapper: fluid padding on mobile,
 * centered max-width on desktop.
 */
export function ResponsiveContainer({
  children,
  className,
}: ResponsiveContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8",
        className,
      )}
    >
      {children}
    </div>
  );
}
