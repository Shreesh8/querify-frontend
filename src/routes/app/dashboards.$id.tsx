import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { datasetsApi, analyticsApi } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MessageSquare, TrendingUp, AlertTriangle } from "lucide-react";
import { ResultChart } from "@/components/charts/ResultChart";

export const Route = createFileRoute("/app/dashboards/$id")({
  component: DashboardDetail,
});

function histogramToChart(histogram: any) {
  const { bins, counts, column } = histogram;
  return {
    type: "bar",
    x: counts.map((_: number, i: number) => `${bins[i]?.toFixed(1)}–${bins[i + 1]?.toFixed(1)}`),
    y: counts,
    x_label: column,
    y_label: "count",
  };
}

function categoriesToChart(items: { value: string; count: number }[], column: string) {
  return {
    type: "bar",
    x: items.map((i) => i.value),
    y: items.map((i) => i.count),
    x_label: column,
    y_label: "count",
  };
}

function nullsToChart(nullAnalysis: { column: string; null_percent: number }[]) {
  return {
    type: "bar",
    x: nullAnalysis.map((n) => n.column),
    y: nullAnalysis.map((n) => n.null_percent),
    x_label: "column",
    y_label: "null %",
  };
}

function CorrelationHeatmap({ matrix }: { matrix: Record<string, Record<string, number>> }) {
  const cols = Object.keys(matrix);
  return (
    <div className="overflow-x-auto">
      <table className="text-xs border-collapse w-full">
        <thead>
          <tr>
            <th className="p-2" />
            {cols.map((c) => (
              <th key={c} className="p-2 font-mono text-muted-foreground whitespace-nowrap">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cols.map((r) => (
            <tr key={r}>
              <td className="p-2 font-mono text-muted-foreground text-right whitespace-nowrap">{r}</td>
              {cols.map((c) => {
                const v = matrix[r]?.[c] ?? 0;
                const intensity = Math.min(Math.abs(v), 1);
                const bg = v >= 0
                  ? `rgba(139, 92, 246, ${intensity * 0.6})`
                  : `rgba(239, 68, 68, ${intensity * 0.6})`;
                return (
                  <td key={c} className="p-2 text-center font-mono rounded" style={{ background: bg }}>
                    {v.toFixed(2)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DashboardDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const goToInsight = () => navigate({ to: "/app/chart-insight" });

  const ds = useQuery({
    queryKey: ["dataset", id],
    queryFn: () => datasetsApi.preview(id),
  });

  const analytics = useQuery({
    queryKey: ["analytics", id],
    queryFn: () => analyticsApi.get(id),
  });

  if (ds.isLoading || analytics.isLoading) {
    return <div className="p-10 text-sm text-muted-foreground">Loading dashboard… ds:{String(ds.isLoading)} analytics:{String(analytics.isLoading)} dsErr:{String(ds.error)} aErr:{String(analytics.error)}</div>;
  }

  const d = ds.data as any;
  const a = analytics.data as any;
  if (!d || !a) return <div className="p-10 text-muted-foreground">Dataset not found.</div>;

  const charts = a.chart_data ?? {};
  const topCategories = a.top_categories ?? {};
  const nullAnalysis = (a.null_analysis ?? []).filter((n: any) => n.null_percent > 0);
  const outliers = a.outliers ?? [];

  return (
    <div className="mx-auto max-w-7xl p-6 lg:p-10 space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/app/dashboards" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" /> Dashboards
          </Link>
          <h1 className="mt-1 font-display text-3xl font-semibold">{d.name}</h1>
          <div className="mt-2 flex gap-2 text-xs">
            <Badge variant="secondary">{a.row_count?.toLocaleString()} rows</Badge>
            <Badge variant="secondary">{a.column_count} cols</Badge>
            <Badge variant="outline" className="text-green-400 border-green-400/30">
              Health: {a.health_score}/100
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/app/chat"><MessageSquare className="mr-1 h-4 w-4" /> Ask AI</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/app/forecast"><TrendingUp className="mr-1 h-4 w-4" /> Forecast</Link>
          </Button>
        </div>
      </header>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Rows", value: a.row_count?.toLocaleString() },
          { label: "Columns", value: a.column_count },
          { label: "Duplicates", value: a.duplicate_count },
          { label: "Health Score", value: `${a.health_score}/100` },
        ].map((s) => (
          <Card key={s.label} className="glass border-glass-border p-4 text-center">
            <div className="text-2xl font-semibold font-display">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Auto-generated charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        {charts.bar && (
          <Card className="glass border-glass-border p-6">
            <h2 className="font-display text-lg font-semibold mb-3">
              Average {(charts.bar.y_label ?? "").replace("avg ", "")} by {charts.bar.x_label}
            </h2>
            <ResultChart chart={charts.bar} onInsightClick={goToInsight} clickable title={`Average ${(charts.bar.y_label ?? "").replace("avg ", "")} by ${charts.bar.x_label}`} />
          </Card>
        )}
        {charts.pie && (
          <Card className="glass border-glass-border p-6">
            <h2 className="font-display text-lg font-semibold mb-3">
              Distribution of {charts.pie.column}
            </h2>
            <ResultChart chart={charts.pie} onInsightClick={goToInsight} clickable title={`Distribution of ${charts.pie.column}`} />
          </Card>
        )}
        {charts.histogram && (
          <Card className="glass border-glass-border p-6">
            <h2 className="font-display text-lg font-semibold mb-3">
              Distribution of {charts.histogram.column}
            </h2>
            <ResultChart chart={histogramToChart(charts.histogram)} onInsightClick={goToInsight} clickable title={`Distribution of ${charts.histogram.column}`} />
          </Card>
        )}
        {charts.scatter && (
          <Card className="glass border-glass-border p-6">
            <h2 className="font-display text-lg font-semibold mb-3">
              {charts.scatter.x_label} vs {charts.scatter.y_label}
            </h2>
            <ResultChart chart={charts.scatter} onInsightClick={goToInsight} clickable title={`${charts.scatter.x_label} vs ${charts.scatter.y_label}`} />
          </Card>
        )}
      </div>

      {/* Top categories */}
      {Object.keys(topCategories).length > 0 && (
        <div>
          <h2 className="font-display text-lg font-semibold mb-3">Top values by column</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {Object.entries(topCategories).map(([col, items]) => (
              <Card key={col} className="glass border-glass-border p-6">
                <h3 className="text-sm font-medium mb-3 font-mono text-muted-foreground">{col}</h3>
                <ResultChart chart={categoriesToChart(items as any[], col)} onInsightClick={goToInsight} clickable title={`Top values — ${col}`} />
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Data quality */}
      <div className="grid gap-4 lg:grid-cols-2">
        {nullAnalysis.length > 0 && (
          <Card className="glass border-glass-border p-6">
            <h2 className="font-display text-lg font-semibold mb-3">Missing data by column</h2>
            <ResultChart chart={nullsToChart(nullAnalysis)} onInsightClick={goToInsight} clickable title="Missing data by column" />
          </Card>
        )}

        {a.correlation_matrix && (
          <Card className="glass border-glass-border p-6">
            <h2 className="font-display text-lg font-semibold mb-3">Correlation matrix</h2>
            <CorrelationHeatmap matrix={a.correlation_matrix} />
          </Card>
        )}

        {outliers.length > 0 && (
          <Card className="glass border-glass-border p-6">
            <h2 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-400" /> Outliers detected
            </h2>
            <div className="space-y-2">
              {outliers.map((o: any) => (
                <div key={o.column} className="flex items-center justify-between text-sm p-2 rounded bg-white/[0.02] border border-glass-border">
                  <span className="font-mono">{o.column}</span>
                  <Badge variant="outline">{o.outlier_count} outliers</Badge>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
