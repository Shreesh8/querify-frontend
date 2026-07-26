import { createFileRoute, Link, Outlet, useMatchRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { datasetsApi, analyticsApi } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PieChart, BarChart3, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/app/dashboards")({
  component: DashboardsPage,
});

function DashboardsPage() {
  const matchRoute = useMatchRoute();
  const isChild = matchRoute({ to: "/app/dashboards/$id" });
  const { data: datasets = [] } = useQuery({
    queryKey: ["datasets"],
    queryFn: () => datasetsApi.list(),
  });


  if (isChild) return <Outlet />;
  return (
    <div className="mx-auto max-w-7xl p-6 lg:p-10 space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold">Dashboards</h1>
        <p className="text-sm text-muted-foreground">Auto-generated analytics for your datasets.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(datasets as any[]).map((d) => (
          <Link key={d.id} to={`/app/dashboards/${d.id}`}>
            <Card className="glass border-glass-border p-6 hover:border-primary/30 transition cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-accent-violet/20">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-medium">{d.name}</div>
                  <div className="text-xs text-muted-foreground">{d.row_count?.toLocaleString()} rows</div>
                </div>
              </div>
              <div className="mt-4 flex gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><PieChart className="h-3 w-3" /> Analytics</span>
                <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Forecast</span>
              </div>
            </Card>
          </Link>
        ))}
        {!(datasets as any[]).length && (
          <Card className="glass border-glass-border p-10 sm:col-span-2 lg:col-span-3 text-center">
            <PieChart className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">No datasets yet.</p>
            <Button asChild className="mt-4 bg-gradient-to-r from-primary to-accent-violet text-primary-foreground shadow-glow">
              <Link to="/app/datasets/new">Upload a dataset to get started</Link>
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
