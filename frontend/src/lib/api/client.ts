const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3006";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
};

/**
 * Shared fetch wrapper for the NestJS backend.
 * - Always sends cookies (Better Auth session)
 * - Parses backend error responses ({ message })
 * - Throws ApiError on non-2xx
 */
export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body } = options;

  const response = await fetch(`${API_URL}${path}`, {
    method,
    credentials: "include",
    headers:
      body !== undefined
        ? { "Content-Type": "application/json" }
        : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    // Expired/invalid session: bounce to login (browser only).
    if (
      response.status === 401 &&
      typeof window !== "undefined" &&
      !window.location.pathname.startsWith("/login")
    ) {
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- non-component module; hard nav also clears stale client state after session expiry
      window.location.href = "/login";
    }

    let message = `Request failed with status ${response.status}`;

    try {
      const data = (await response.json()) as {
        message?: string | string[];
      };

      if (Array.isArray(data.message)) {
        message = data.message.join(", ");
      } else if (typeof data.message === "string") {
        message = data.message;
      }
    } catch {
      // Response had no JSON body; keep default message
    }

    throw new ApiError(response.status, message);
  }

  // Handle empty responses (e.g. 204)
  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

export { API_URL };
