import type { ReactNode } from "react";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { ConstructionIcon } from "lucide-react";

/**
 * Temporary page body for nav sections whose modules
 * aren't built yet. Keeps routes alive (no 404s) while
 * staying honest about missing content.
 */
export function ModulePlaceholder({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon?: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />
      <EmptyState
        icon={icon ?? <ConstructionIcon />}
        title={`${title} module coming soon`}
        description="This section is under construction."
      />
    </div>
  );
}
