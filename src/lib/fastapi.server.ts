/**
 * Server-only HTTP client for the user's FastAPI backend.
 * Configured via FASTAPI_BASE_URL secret. Never imported from client code.
 */

const BASE = () => {
  const url = process.env.FASTAPI_BASE_URL?.replace(/\/$/, "");
  if (!url) throw new Error("FASTAPI_BASE_URL is not configured");
  return url;
};

export type FastApiOpts = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  body?: unknown;
  userId?: string;
  timeoutMs?: number;
};

export async function fastapi<T = unknown>(opts: FastApiOpts): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts.timeoutMs ?? 60_000);
  try {
    const res = await fetch(`${BASE()}${opts.path}`, {
      method: opts.method ?? "POST",
      headers: {
        "Content-Type": "application/json",
        ...(opts.userId ? { "x-user-id": opts.userId } : {}),
        ...(process.env.FASTAPI_API_KEY
          ? { Authorization: `Bearer ${process.env.FASTAPI_API_KEY}` }
          : {}),
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      signal: controller.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`FastAPI ${opts.path} failed: ${res.status} ${text}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

export function isFastApiConfigured() {
  return !!process.env.FASTAPI_BASE_URL;
}