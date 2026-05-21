import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listDashboards } from "@/lib/dashboards.functions";
import { Card } from "@/components/ui/card";
import { PieChart } from "lucide-react";

export const Route = createFileRoute("/app/dashboards")({
  component: DashboardsPage,
});

function DashboardsPage() {
  const fn = useServerFn(listDashboards);
  const { data } = useQuery({ queryKey: ["dashboards"], queryFn: () => fn() });

  return (
    <div className="mx-auto max-w-7xl p-6 lg:p-10 space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold">Dashboards</h1>
        <p className="text-sm text-muted-foreground">Save and share AI-generated visualizations.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.dashboards.map((d) => (
          <Card key={d.id} className="glass border-glass-border p-6">
            <PieChart className="h-6 w-6 text-primary" />
            <div className="mt-3 font-medium">{d.name}</div>
            <div className="mt-1 text-xs text-muted-foreground">Updated {new Date(d.updated_at).toLocaleDateString()}</div>
          </Card>
        ))}
        {data && data.dashboards.length === 0 && (
          <Card className="glass border-glass-border p-10 sm:col-span-2 lg:col-span-3 text-center">
            <PieChart className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">No dashboards yet.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Build one from a <Link to="/app/chat" className="text-primary hover:underline">chat conversation</Link>.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}