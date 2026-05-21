import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listDatasets } from "@/lib/datasets.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, MessageSquare, TrendingUp, Plus, Sparkles, ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/")({
  component: OverviewPage,
});

function OverviewPage() {
  const fn = useServerFn(listDatasets);
  const { data } = useQuery({ queryKey: ["datasets"], queryFn: () => fn() });
  const datasets = data?.datasets ?? [];
  const totalRows = datasets.reduce((s, d) => s + (d.row_count ?? 0), 0);

  const stats = [
    { label: "Datasets", value: datasets.length, icon: Database },
    { label: "Total rows", value: totalRows.toLocaleString(), icon: TrendingUp },
    { label: "AI queries", value: "—", icon: MessageSquare },
    { label: "Insights", value: "—", icon: Sparkles },
  ];

  return (
    <div className="mx-auto max-w-7xl p-6 lg:p-10 space-y-8">
      <header>
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Overview</div>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
          Your <span className="bg-gradient-to-r from-primary to-accent-violet bg-clip-text text-transparent">intelligence</span> workspace
        </h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-xl">
          Upload data, ask questions in plain English, and ship dashboards your team will actually read.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="glass border-glass-border p-5">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
              <s.icon className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-3 font-display text-2xl font-semibold">{s.value}</div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="glass border-glass-border p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Recent datasets</h2>
            <Button asChild size="sm" variant="ghost">
              <Link to="/app/datasets">View all <ArrowUpRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </div>
          <div className="mt-4 divide-y divide-glass-border">
            {datasets.slice(0, 5).map((d) => (
              <Link
                key={d.id}
                to="/app/datasets/$id"
                params={{ id: d.id }}
                className="flex items-center justify-between py-3 hover:bg-white/[0.02] rounded px-2 -mx-2"
              >
                <div>
                  <div className="font-medium text-sm">{d.name}</div>
                  <div className="text-xs text-muted-foreground">{d.row_count?.toLocaleString()} rows · {d.col_count} cols</div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
            {!datasets.length && (
              <div className="py-10 text-center">
                <p className="text-sm text-muted-foreground">No datasets yet.</p>
                <Button asChild className="mt-4 bg-gradient-to-r from-primary to-accent-violet text-primary-foreground shadow-glow">
                  <Link to="/app/datasets/new"><Plus className="mr-1 h-4 w-4" /> Upload your first dataset</Link>
                </Button>
              </div>
            )}
          </div>
        </Card>

        <Card className="glass border-glass-border p-6">
          <h2 className="font-display text-lg font-semibold">Quick actions</h2>
          <div className="mt-4 space-y-2">
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/app/datasets/new"><Plus className="mr-2 h-4 w-4" /> Upload dataset</Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/app/chat"><MessageSquare className="mr-2 h-4 w-4" /> Ask AI</Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/app/forecast"><TrendingUp className="mr-2 h-4 w-4" /> Forecast</Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}