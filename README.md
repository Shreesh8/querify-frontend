# Querify — Frontend

The frontend for [Querify](https://querify.site), an AI-powered business intelligence platform. Users upload CSV/XLSX datasets and interact with their data through natural language — querying, dashboards, and forecasting, without writing SQL.

**Live app:** [querify.site](https://querify.site)
**Backend repo:** [querify-backend](https://github.com/Shreesh8/querify-backend)

## Tech Stack

- React + TypeScript
- [TanStack Router](https://tanstack.com/router) (file-based routing, SSR)
- TailwindCSS
- Framer Motion
- [shadcn/ui](https://ui.shadcn.com) components
- Bun (package manager)
- Deployed on Cloudflare Workers

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) installed locally

### Install dependencies

```bash
bun install
```

### Environment variables

Create a `.env` (or `.env.local`) file in the project root:

```
VITE_API_BASE_URL=https://api.querify.site
```

For local development against a local backend instance, point this at `http://localhost:8000` instead.

### Run the dev server

```bash
bun run dev
```

### Build for production

```bash
bun run build
```

## Deployment

The app deploys to Cloudflare Workers via Wrangler:

```bash
npx wrangler deploy
```

Configuration lives in `wrangler.jsonc`. The production build reads `VITE_API_BASE_URL` from `.env.production` at build time (Vite inlines this at build, so it must be set before running `bun run build`, not just in the Workers dashboard).

## Project Structure

```
src/
  routes/       # TanStack Router file-based routes
  lib/          # API client, shared utilities
  components/   # UI components
supabase/       # Supabase-related config (if applicable)
```

## Architecture Notes

The frontend talks to a FastAPI backend over HTTPS (`api.querify.site`, tunneled from an AWS EC2 instance via Cloudflare Tunnel). Natural language queries are sent to the backend, which returns a whitelisted JSON operation spec rather than executable code — the frontend renders results from that structured response rather than evaluating anything client-side.
