import type { ReactNode } from "react";
import { requireRole } from "@/lib/require-role";
import { AppShell } from "@/components/shell/app-shell";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireRole(["ADMIN"]);

  return (
    <AppShell user={session.user}>
      {children}
    </AppShell>
  );
}
