import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // Same-origin /api/auth — proxied to the NestJS backend by
  // Next.js rewrites (next.config.ts), keeping the session
  // cookie first-party on this domain.
  baseURL: "",
  fetchOptions: {
    credentials: "include",
  },
});