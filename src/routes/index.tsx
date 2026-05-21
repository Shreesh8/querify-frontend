import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Sparkles, MessageSquare, TrendingUp, Database, BarChart3, Brain, ArrowRight, Check,
} from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Insightly — AI Business Intelligence" },
      { name: "description", content: "Upload CSV or Excel, chat with your data, and ship dashboards in minutes. Built for modern data teams." },
      { property: "og:title", content: "Insightly — AI Business Intelligence" },
      { property: "og:description", content: "Premium AI-powered analytics. Natural language querying, forecasting, and dashboards." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[600px] w-[1100px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,oklch(0.55_0.2_265/0.35),transparent_60%)] blur-3xl" />
        <div className="absolute top-1/3 right-0 h-[500px] w-[700px] rounded-full bg-[radial-gradient(circle,oklch(0.55_0.22_300/0.25),transparent_60%)] blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,oklch(1_0_0/0.04)_1px,transparent_1px),linear-gradient(to_bottom,oklch(1_0_0/0.04)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]" />
      </div>

      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent-violet shadow-glow">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight">Insightly</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost"><Link to="/login">Sign in</Link></Button>
          <Button asChild className="bg-gradient-to-r from-primary to-accent-violet text-primary-foreground shadow-glow">
            <Link to="/signup">Get started <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>
      </nav>

      <section className="mx-auto max-w-7xl px-6 pt-16 pb-24 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="inline-flex items-center gap-2 rounded-full border border-glass-border bg-glass px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            New: ARIMA & Prophet forecasting
          </div>
          <h1 className="mt-6 font-display text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.05]">
            Talk to your data.
            <br />
            <span className="bg-gradient-to-r from-primary via-accent-violet to-primary bg-clip-text text-transparent">
              Ship insights in minutes.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-muted-foreground">
            Upload a CSV or Excel file. Ask questions in plain English. Generate dashboards, anomalies, and forecasts — without writing a single SQL query.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="h-12 px-6 bg-gradient-to-r from-primary to-accent-violet text-primary-foreground shadow-glow">
              <Link to="/signup">Start free <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-6">
              <Link to="/login">View demo</Link>
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-20 mx-auto max-w-5xl"
        >
          <div className="glass border-glass-border rounded-2xl border p-2 shadow-2xl">
            <div className="rounded-xl bg-background/60 p-6 text-left">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Brain className="h-3.5 w-3.5 text-primary" />
                <span>You asked</span>
              </div>
              <p className="mt-1 font-display text-lg">"What were our top regions by revenue last quarter?"</p>
              <div className="mt-6 grid grid-cols-4 gap-3">
                {[78, 94, 62, 88, 70, 96, 55, 81, 92, 67, 84, 73].map((h, i) => (
                  <div key={i} className="rounded-lg bg-gradient-to-t from-primary/80 to-accent-violet/80" style={{ height: `${h}px` }} />
                ))}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-xs text-muted-foreground">
                <div>EMEA <span className="text-foreground font-medium">+24%</span></div>
                <div>Americas <span className="text-foreground font-medium">+18%</span></div>
                <div>APAC <span className="text-foreground font-medium">+31%</span></div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="text-center">
          <div className="text-xs uppercase tracking-[0.2em] text-primary">Capabilities</div>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight">Everything modern teams need</h2>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: Database, t: "Smart upload", d: "Drop CSV or XLSX. We profile columns, detect types, and flag missing data instantly." },
            { icon: MessageSquare, t: "Ask in English", d: "Chat with your dataset like ChatGPT. Get charts, tables, and explanations." },
            { icon: BarChart3, t: "Auto dashboards", d: "Pin AI-generated charts to shareable dashboards your team will actually read." },
            { icon: TrendingUp, t: "Forecasting", d: "ARIMA, Prophet, and linear baselines for revenue, traffic, churn — anything numeric." },
            { icon: Brain, t: "AI insights", d: "Anomaly detection, correlation discovery, segment analysis — all narrated." },
            { icon: Sparkles, t: "Glass-grade UI", d: "Designed for executives. Dark theme, minimal chrome, focus on the numbers." },
          ].map((f) => (
            <div key={f.t} className="glass border-glass-border rounded-2xl border p-6 hover:border-primary/30 transition">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-accent-violet/20">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{f.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <div className="glass border-glass-border rounded-3xl border p-12">
          <h2 className="font-display text-4xl font-semibold tracking-tight">Ready to query your data?</h2>
          <p className="mt-3 text-muted-foreground">Free to start. No credit card required.</p>
          <ul className="mx-auto mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {["Unlimited datasets", "AI chat", "Forecasting", "Shareable dashboards"].map((x) => (
              <li key={x} className="flex items-center gap-1"><Check className="h-4 w-4 text-primary" /> {x}</li>
            ))}
          </ul>
          <Button asChild size="lg" className="mt-8 h-12 px-8 bg-gradient-to-r from-primary to-accent-violet text-primary-foreground shadow-glow">
            <Link to="/signup">Create your workspace <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-glass-border py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Insightly · Premium AI Business Intelligence
      </footer>
    </div>
  );
}
