import { redirect } from "next/navigation";
import { getSession, type Session } from "@/lib/session";
import { roleHome } from "@/lib/roles";
import type { Role } from "@/lib/api/types";

/**
 * Authoritative server-side guard for protected layouts.
 *
 * - No session          → /login
 * - Session, wrong role → /unauthorized
 *
 * The backend still enforces every API call; this prevents
 * unauthenticated/unauthorized rendering of route trees.
 */
export async function requireRole(
  allowedRoles: Role[],
): Promise<Session> {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (!allowedRoles.includes(session.user.role)) {
    redirect("/unauthorized");
  }

  return session;
}

/**
 * For pages that redirect signed-in users to their role home
 * (used by / and /login's server wrapper).
 */
export async function redirectIfAuthenticated() {
  const session = await getSession();

  if (session) {
    redirect(roleHome(session.user.role));
  }
}
