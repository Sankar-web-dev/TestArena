import type { Role } from "@/lib/api/types";

/**
 * Route each role lands on after login.
 * Safe to import from both server and client components.
 */
export function roleHome(role: Role): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "STUDENT":
      return "/student";
  }
}
