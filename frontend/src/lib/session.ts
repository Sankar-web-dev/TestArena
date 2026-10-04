import { headers } from "next/headers";
import type { Role } from "@/lib/api/types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3006";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  image?: string | null;
}

export interface Session {
  user: SessionUser;
  session: {
    id: string;
    expiresAt: string;
    token: string;
  };
}

/**
 * Server-side session check.
 *
 * Forwards the incoming request's cookies to the NestJS
 * Better Auth endpoint. The backend is authoritative —
 * this returns null when the cookie is absent, expired,
 * or invalid.
 *
 * Must only be called from Server Components/layouts.
 */
export async function getSession(): Promise<Session | null> {
  const cookieHeader = (await headers()).get("cookie");

  if (!cookieHeader) {
    return null;
  }

  try {
    const response = await fetch(
      `${API_URL}/api/auth/get-session`,
      {
        headers: { cookie: cookieHeader },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as Session | null;

    if (!data?.user) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}
