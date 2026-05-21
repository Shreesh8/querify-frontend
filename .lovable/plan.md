
# AI Business Intelligence Assistant — Architecture Plan

## 0. Important stack note (please read first)

Your spec lists **FastAPI + PostgreSQL + Pandas/NumPy/Scikit-learn**. Lovable projects run on **TanStack Start (React 19 + Vite)** deployed to **Cloudflare Workers**, with **Lovable Cloud (Supabase: Postgres + Auth + Storage)** as the backend. The Worker runtime cannot run Python, Pandas, scikit-learn, or a FastAPI process.

You have three realistic paths. Pick one before I generate code:

- **A. Lovable-native (recommended for "recruiter-worthy" and shippable today):** TanStack Start server functions + Lovable Cloud (Postgres/Auth/Storage) + Lovable AI Gateway (Gemini/GPT-5). Analytics done in TypeScript (arquero/danfo.js/simple-statistics) or via SQL on Postgres. Forecasting via a lightweight JS lib or the LLM with tool-calling.
- **B. Hybrid:** Lovable frontend + external FastAPI service (Render/Fly/Railway) you host yourself for Pandas/sklearn. Lovable calls it over HTTPS. More resume signal for "Python ML", more ops overhead.
- **C. Frontend-only here, backend elsewhere:** Build only the React UI in Lovable, run FastAPI separately. Simplest split but loses Lovable's integrated auth/storage.

The plan below is written for **Path A** with notes on where Path B swaps in. Tell me if you want B or C instead.

---

## 1. Folder Structure (Path A, TanStack Start)

```text
src/
  routes/
    __root.tsx                  layout shell (providers, head)
    index.tsx                   marketing / landing
    login.tsx, signup.tsx
    _authenticated.tsx          auth gate (redirects to /login)
    _authenticated/
      dashboard.tsx             list of user datasets + dashboards
      datasets.index.tsx        upload + library
      datasets.$id.tsx          dataset detail: preview, schema, EDA
      datasets.$id.chat.tsx     NL querying chat over the dataset
      datasets.$id.forecast.tsx forecasting workspace
      dashboards.$id.tsx        saved multi-chart dashboard
    api/
      public/
        health.ts               health check
  components/
    upload/        Dropzone, ParseProgress, SchemaInferPreview
    dataset/       PreviewTable, ColumnStats, TypeBadges
    charts/        ChartRenderer (Recharts), ChartSpec types
    dashboard/     DashboardGrid, ChartCard, FilterBar
    chat/          MessageList, Composer, ToolCallTrace
    insights/      InsightCard, InsightFeed
    ui/            shadcn primitives
  lib/
    analytics/     profile.ts, stats.ts, correlations.ts, outliers.ts
    forecasting/   movingAverage.ts, linearTrend.ts, seasonalNaive.ts
    parsing/       csv.ts (papaparse), xlsx.ts (sheetjs), schemaInfer.ts
    charts/        autoSuggest.ts (pick chart from column types)
    ai/            prompts.ts, tools.ts (tool schemas for the LLM)
    *.functions.ts createServerFn entry points (client-safe imports)
    *.server.ts    server-only helpers (DB, AI gateway calls)
  integrations/supabase/   client.ts, client.server.ts, auth-middleware.ts
  hooks/         useDataset, useChat, useDashboard
  styles.css
supabase/migrations/        SQL migrations (datasets, rows, dashboards, chats, insights)
```

---

## 2. Backend Architecture

**Runtime:** TanStack Start server functions (`createServerFn`) for app RPC; `routes/api/public/*` for webhooks/health. Auth-gated functions use `requireSupabaseAuth` middleware.

**Data layer (Lovable Cloud / Postgres):**

```text
profiles(id, ...)
datasets(id, user_id, name, source_filename, row_count, col_count, schema jsonb, storage_path, created_at)
dataset_columns(id, dataset_id, name, dtype, null_pct, unique_count, stats jsonb)
dataset_rows(id, dataset_id, row_idx, data jsonb)          -- or a per-dataset materialized table
conversations(id, user_id, dataset_id, title, created_at)
messages(id, conversation_id, role, content, tool_calls jsonb, created_at)
dashboards(id, user_id, dataset_id, name, layout jsonb)
charts(id, dashboard_id, spec jsonb, position jsonb)
insights(id, dataset_id, type, payload jsonb, created_at)
forecasts(id, dataset_id, target_col, horizon, method, result jsonb)
```
RLS on every table: `user_id = auth.uid()` (or via dataset ownership join). Roles in a separate `user_roles` table with a `has_role()` SECURITY DEFINER function.

**Storage:** Supabase Storage bucket `datasets/` (private). Original file kept; parsed rows persisted to Postgres for query/preview.

**Server function modules:**
- `datasets.functions.ts` — `createDataset`, `listDatasets`, `getDataset`, `deleteDataset`
- `ingest.functions.ts` — `parseAndIngest(datasetId)`: stream parse, infer schema, write rows, compute column stats
- `analytics.functions.ts` — `profileDataset`, `correlate`, `groupByAggregate`, `detectOutliers`
- `forecast.functions.ts` — `runForecast(datasetId, col, horizon, method)`
- `ai.functions.ts` — `chatOverDataset` (LLM with tool calls), `generateInsights`, `suggestDashboard`
- `dashboards.functions.ts` — CRUD for dashboards/charts

**AI layer (Lovable AI Gateway):** model default `google/gemini-3-flash-preview`; structured output via tool-calling for: `run_sql`, `aggregate`, `make_chart`, `forecast`, `summarize`. The LLM never sees raw rows beyond a sample + schema + column stats; it emits tool calls that server functions execute against Postgres, then it narrates results.

**Path B swap-in:** replace `analytics.functions.ts` / `forecast.functions.ts` with thin server functions that POST to your FastAPI service (`/profile`, `/forecast`, `/query`). Keep auth + storage + chat orchestration in Lovable.

---

## 3. Frontend Architecture

**Routing & state:** TanStack Router for routes, TanStack Query for server state, Zustand only if needed for chat composer / dashboard editor local state. Forms via react-hook-form + zod.

**Key surfaces:**
1. **Upload flow** — dropzone → client-side parse preview (first 200 rows) → confirm schema → server ingest with progress.
2. **Dataset detail** — tabs: Preview · Schema & Stats · Auto-EDA · Chat · Forecast · Dashboards.
3. **Auto-EDA** — server returns a profile JSON; UI renders distribution mini-charts, correlations heatmap, top categorical breakdowns, outlier callouts.
4. **NL chat** — streamed responses from server fn; tool-call traces shown as collapsible "thinking" steps; charts rendered inline from returned `ChartSpec`.
5. **Dashboards** — drag-and-drop grid (react-grid-layout) of saved chart specs; filter bar broadcasts to all charts.
6. **Forecasting** — pick target column + horizon + method; chart of history + forecast band; export.

**Charting:** Recharts as default (lighter, SSR-friendly). One `ChartRenderer` consumes a typed `ChartSpec` so AI, auto-EDA, and dashboards all share a single rendering path.

**Design system:** semantic tokens in `src/styles.css` (oklch). I'll propose a polished direction (palette, typography, layout) once you confirm the path — not generic SaaS blue.

---

## 4. Scalable Architecture Patterns

- **Tool-calling agent** (single source of truth for AI actions; deterministic execution server-side).
- **ChartSpec contract** (decouples chart producers from renderer).
- **Server-fn boundary** (no direct DB from components; everything goes through typed RPC with zod validation).
- **RLS-first multitenancy** (security at DB, not app code).
- **Streaming ingest** (Papaparse stream → batched inserts) to handle large CSVs without OOM.
- **Cached profiles** (compute once on ingest; invalidate on re-upload) — avoids recomputing stats per page load.
- **Query plan vs. row fetch separation** — LLM produces a plan, server executes against Postgres (SQL or aggregations), result fed back. Keeps token use low and answers grounded.
- **Background jobs** for heavy work (forecast, full profile) via a queued server route + status polling.

---

## 5. Development Flow — Phase by Phase

**Phase 1 — Foundation (auth + shell)**
Enable Lovable Cloud, auth (email + Google), `_authenticated` layout, app shell, design system, landing page.

**Phase 2 — Upload & Ingest**
Storage bucket, `datasets` + `dataset_columns` + `dataset_rows` tables with RLS, upload UI, streamed parse, schema inference, persistence, preview table.

**Phase 3 — Auto-EDA**
`profileDataset` server fn (counts, nulls, distributions, correlations, outliers), profile UI, mini-charts.

**Phase 4 — ChartSpec + Manual Charts**
Define `ChartSpec`, build `ChartRenderer`, "create chart" UI driven by column picker.

**Phase 5 — NL Chat (AI Gateway)**
Conversations/messages tables, streaming server fn, tool schemas (`aggregate`, `make_chart`, `run_sql_readonly`), inline chart rendering, tool-trace UI.

**Phase 6 — Insights**
`generateInsights` (LLM summarizes profile + notable findings), insight feed on dataset page.

**Phase 7 — Forecasting**
JS forecasters (moving avg, linear trend, seasonal naive) — or FastAPI ARIMA/Prophet in Path B. Forecast workspace UI.

**Phase 8 — Dashboards**
`dashboards` + `charts` tables, grid editor, filter bar, "AI: suggest dashboard" action.

**Phase 9 — Polish & recruiter-ready**
SEO per route, empty/error/loading states, sample datasets, demo mode, README with architecture diagram, deploy/publish.

---

## Decisions I need from you before generating code

1. **Stack path:** A (Lovable-native, recommended), B (Lovable + your FastAPI), or C (frontend-only)?
2. **AI provider:** Lovable AI Gateway (default, no keys to manage) or your own OpenAI/Gemini key?
3. **Forecasting depth:** lightweight JS (Path A) is fine, or do you specifically need ARIMA/Prophet (pushes you to Path B)?
4. **Design direction:** want me to generate 3 visual directions to pick from, or do you have a reference?
