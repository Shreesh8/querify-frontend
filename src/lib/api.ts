import { auth } from "@/lib/firebase";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://13.206.197.174:8000";

async function getToken(): Promise<string | null> {
  return new Promise((resolve) => {
    // Wait for auth to initialize
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      unsubscribe();
      if (!user) {
        resolve(null);
        return;
      }
      try {
        const token = await user.getIdToken();
        resolve(token);
      } catch {
        resolve(null);
      }
    });
  });
}

export function isAuthenticated(): boolean {
  return !!auth.currentUser || (typeof window !== "undefined" && !!localStorage.getItem("querify_authed"));
}

type RequestOpts = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  body?: unknown;
  isFormData?: boolean;
};

export async function api<T = unknown>(opts: RequestOpts): Promise<T> {
  const token = await getToken();
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

  if (res.status === 204 || res.headers.get("content-length") === "0") return undefined as T;
  return res.json() as Promise<T>;
}

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
  list: () => api<any[]>({ path: "/api/v1/datasets/" }),
  get: (id: string) => api<any>({ path: `/api/v1/datasets/${id}` }),
  preview: (id: string) => api<any>({ path: `/api/v1/datasets/${id}/preview` }),
  delete: (id: string) => api<any>({ method: "DELETE", path: `/api/v1/datasets/${id}` }),
};

export const analyticsApi = {
  get: (datasetId: string) => api<any>({ path: `/api/v1/analytics/${datasetId}` }),
};

export const suggestionsApi = {
  get: (datasetId: string) => api<{ suggestions: string[] }>({ path: `/api/v1/chat/suggestions/${datasetId}` }),
};

export const billingApi = {
  getUsage: () => api<any>({ path: "/api/v1/billing/usage" }),
};

export const chatApi = {
  query: (datasetId: string, question: string) =>
    api<{ answer: string; result_data: any; execution_time_ms: number }>({
      method: "POST",
      path: "/api/v1/chat/query",
      body: { dataset_id: datasetId, question },
    }),
};

export const insightsApi = {
  get: (datasetId: string) => api<any>({ path: `/api/v1/insights/${datasetId}` }),
};

export const forecastApi = {
  generate: (payload: {
    dataset_id: string;
    date_column: string;
    target_column: string;
    periods: number;
    frequency: string;
  }) => api<any>({ method: "POST", path: "/api/v1/forecast/generate", body: payload }),
};
