import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { datasetsApi, analyticsApi, insightsApi } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, MessageSquare, TrendingUp, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/datasets/$id")({
  component: DatasetDetail,
});

function DatasetDetail() {
  const { id } = Route.useParams();

  const ds = useQuery({
    queryKey: ["dataset", id],
    queryFn: () => datasetsApi.preview(id),
  });

  const analytics = useQuery({
    queryKey: ["analytics", id],
    queryFn: () => analyticsApi.get(id),
  });

  const insights = useQuery({
    queryKey: ["insights", id],
    queryFn: () => insightsApi.get(id),
    enabled: false,
  });

  const genMut = useMutation({
    mutationFn: () => insightsApi.get(id),
    onSuccess: () => {
      insights.refetch();
      toast.success("Insights generated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (ds.isLoading) return <div className="p-10 text-sm text-muted-foreground">Loading…</div>;
  const d = ds.data as any;
  if (!d) return <div className="p-10 text-muted-foreground">Dataset not found.</div>;

  const insightData = (insights.data as any) || (genMut.data as any);

  return (
    <div className="mx-auto max-w-7xl p-6 lg:p-10 space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/app/datasets" className="text-xs text-muted-foreground hover:text-foreground">← Datasets</Link>
          <h1 className="mt-1 font-display text-3xl font-semibold">{d.name}</h1>
          <div className="mt-2 flex gap-2 text-xs">
            <Badge variant="secondary">{d.row_count?.toLocaleString()} rows</Badge>
            <Badge variant="secondary">{d.column_count} cols</Badge>
            <Badge variant="outline">{d.original_filename ?? d.name}</Badge>
            {d.health_score && (
              <Badge variant="outline" className="text-green-400 border-green-400/30">
                Health: {d.health_score}/100
              </Badge>
            )}
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

      {/* Analytics summary */}
      {analytics.data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Rows", value: (analytics.data as any).row_count?.toLocaleString() },
            { label: "Columns", value: (analytics.data as any).column_count },
            { label: "Duplicates", value: (analytics.data as any).duplicate_count },
            { label: "Health Score", value: `${(analytics.data as any).health_score}/100` },
          ].map((s) => (
            <Card key={s.label} className="glass border-glass-border p-4 text-center">
              <div className="text-2xl font-semibold font-display">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </Card>
          ))}
        </div>
      )}

      {/* AI Insights */}
      <Card className="glass border-glass-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> AI Insights
          </h2>
          <Button size="sm" onClick={() => genMut.mutate()} disabled={genMut.isPending}
            className="bg-gradient-to-r from-primary to-accent-violet text-primary-foreground shadow-glow">
            {genMut.isPending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
            Generate
          </Button>
        </div>
        {insightData?.executive_summary && (
          <p className="text-sm text-muted-foreground mb-4 p-3 rounded-lg bg-white/[0.02] border border-glass-border">
            {insightData.executive_summary}
          </p>
        )}
        <div className="space-y-3">
          {(insightData?.insights ?? []).map((i: any, idx: number) => (
            <div key={idx} className="rounded-xl border border-glass-border bg-white/[0.02] p-4">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${
                  i.severity === "critical" ? "bg-destructive" :
                  i.severity === "warning" ? "bg-yellow-400" : "bg-primary"
                }`} />
                <div className="font-medium text-sm">{i.title}</div>
                <Badge variant="outline" className="text-xs ml-auto">{i.category}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{i.description}</p>
            </div>
          ))}
          {!insightData?.insights?.length && (
            <p className="text-sm text-muted-foreground">No insights yet. Click Generate.</p>
          )}
        </div>
      </Card>

      {/* Schema */}
      <Card className="glass border-glass-border p-6">
        <h2 className="font-display text-lg font-semibold mb-4">Schema</h2>
        <div className="overflow-x-auto rounded-lg border border-glass-border">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.03] text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left p-2">Column</th>
                <th className="text-left p-2">Type</th>
                <th className="text-right p-2">Null %</th>
                <th className="text-right p-2">Sample</th>
              </tr>
            </thead>
            <tbody>
              {(d.columns ?? []).map((c: any) => (
                <tr key={c.name} className="border-t border-glass-border">
                  <td className="p-2 font-mono text-xs">{c.name}</td>
                  <td className="p-2">
                    <span className="rounded bg-primary/15 px-2 py-0.5 text-xs text-primary">{c.dtype}</span>
                  </td>
                  <td className="p-2 text-right text-muted-foreground">{c.null_percent ?? 0}%</td>
                  <td className="p-2 text-right text-muted-foreground text-xs">
                    {c.sample_values?.slice(0, 2).join(", ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
