"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboardIcon, SettingsIcon } from "lucide-react";

import { LogoutButton } from "@/components/auth/logout-button";
import { Button } from "@/components/ui/button";

/**
 * Top-right actions for the standalone student pages —
 * dashboard/settings toggle + sign out.
 */
export function StudentHeaderActions() {
  const pathname = usePathname();
  const onSettings = pathname.startsWith("/student/settings");

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        render={
          <Link
            href={onSettings ? "/student" : "/student/settings"}
          />
        }
      >
        {onSettings ? (
          <>
            <LayoutDashboardIcon />
            Dashboard
          </>
        ) : (
          <>
            <SettingsIcon />
            Settings
          </>
        )}
      </Button>
      <LogoutButton />
    </div>
  );
}
