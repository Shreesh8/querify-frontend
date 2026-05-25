/**
 * src/lib/api.ts
 * Central API client pointing to the Querify FastAPI backend.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://13.206.197.174:8000";

function getToken(): string | null {
  return localStorage.getItem("querify_token");
}

export function setToken(token: string): void {
  localStorage.setItem("querify_token", token);
}

export function clearToken(): void {
  localStorage.removeItem("querify_token");
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

type RequestOpts = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  body?: unknown;
  isFormData?: boolean;
};

export async function api<T = unknown>(opts: RequestOpts): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};

  if (!opts.isFormData) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${opts.path}`, {
    method: opts.method ?? "GET",
    headers,
    body: opts.isFormData
      ? (opts.body as FormData)
      : opts.body
      ? JSON.stringify(opts.body)
      : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? err.detail ?? "Request failed");
  }

  return res.json() as Promise<T>;
}

// ── Auth ──────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api<{ access_token: string }>({
      method: "POST",
      path: "/api/v1/auth/login",
      body: { email, password },
    }),
};

// ── Datasets ──────────────────────────────────────────────────
export const datasetsApi = {
  upload: (file: File, name: string) => {
    const form = new FormData();
    form.append("file", file);
    form.append("name", name);
    return api<{ id: string; name: string; row_count: number; health_score: number }>({
      method: "POST",
      path: "/api/v1/datasets/upload",
      body: form,
      isFormData: true,
    });
  },
  list: () => api<{ id: string; name: string; row_count: number; created_at: string }[]>({
    path: "/api/v1/datasets/",
  }),
  get: (id: string) => api({ path: `/api/v1/datasets/${id}` }),
  preview: (id: string) => api({ path: `/api/v1/datasets/${id}/preview` }),
  delete: (id: string) => api({ method: "DELETE", path: `/api/v1/datasets/${id}` }),
};

// ── Analytics ─────────────────────────────────────────────────
export const analyticsApi = {
  get: (datasetId: string) => api({ path: `/api/v1/analytics/${datasetId}` }),
};

// ── Chat ──────────────────────────────────────────────────────
export const chatApi = {
  query: (datasetId: string, question: string) =>
    api<{ answer: string; result_data: unknown; execution_time_ms: number }>({
      method: "POST",
      path: "/api/v1/chat/query",
      body: { dataset_id: datasetId, question },
    }),
};

// ── Insights ──────────────────────────────────────────────────
export const insightsApi = {
  get: (datasetId: string) => api({ path: `/api/v1/insights/${datasetId}` }),
};

// ── Forecast ──────────────────────────────────────────────────
export const forecastApi = {
  generate: (payload: {
    dataset_id: string;
    date_column: string;
    target_column: string;
    periods: number;
    frequency: string;
  }) => api({ method: "POST", path: "/api/v1/forecast/generate", body: payload }),
};
