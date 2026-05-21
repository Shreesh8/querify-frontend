import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDataset } from "@/lib/datasets.functions";
import { profileDataset, generateInsights, listInsights } from "@/lib/analytics.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, MessageSquare, TrendingUp, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/datasets/$id")({
  component: DatasetDetail,
});

function DatasetDetail() {
  const { id } = Route.useParams();
  const getFn = useServerFn(getDataset);
  const profileFn = useServerFn(profileDataset);
  const insightsFn = useServerFn(generateInsights);
  const listInsFn = useServerFn(listInsights);

  const ds = useQuery({ queryKey: ["dataset", id], queryFn: () => getFn({ data: { id } }) });
  const profile = useQuery({ queryKey: ["profile", id], queryFn: () => profileFn({ data: { datasetId: id } }) });
  const insights = useQuery({ queryKey: ["insights", id], queryFn: () => listInsFn({ data: { datasetId: id } }) });

  const genMut = useMutation({
    mutationFn: () => insightsFn({ data: { datasetId: id } }),
    onSuccess: () => { insights.refetch(); toast.success("Insights generated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (ds.isLoading) return <div className="p-10 text-sm text-muted-foreground">Loading…</div>;
  const d = ds.data?.dataset;
  if (!d) return <div className="p-10">Not found</div>;

  return (
    <div className="mx-auto max-w-7xl p-6 lg:p-10 space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/app/datasets" className="text-xs text-muted-foreground hover:text-foreground">← Datasets</Link>
          <h1 className="mt-1 font-display text-3xl font-semibold">{d.name}</h1>
          <div className="mt-2 flex gap-2 text-xs">
            <Badge variant="secondary">{d.row_count?.toLocaleString()} rows</Badge>
            <Badge variant="secondary">{d.col_count} cols</Badge>
            <Badge variant="outline">{d.source_filename}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link to="/app/chat"><MessageSquare className="mr-1 h-4 w-4" /> Ask AI</Link></Button>
          <Button asChild variant="outline"><Link to="/app/forecast"><TrendingUp className="mr-1 h-4 w-4" /> Forecast</Link></Button>
        </div>
      </header>

      <Card className="glass border-glass-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> AI insights
          </h2>
          <Button size="sm" onClick={() => genMut.mutate()} disabled={genMut.isPending}
            className="bg-gradient-to-r from-primary to-accent-violet text-primary-foreground shadow-glow">
            {genMut.isPending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
            Generate
          </Button>
        </div>
        {profile.data?.source === "fallback" && (
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3 text-xs text-yellow-200">
            <AlertTriangle className="h-4 w-4" />
            Connect your FastAPI backend (set FASTAPI_BASE_URL) to unlock real AI profiling & insights.
          </div>
        )}
        <div className="space-y-3">
          {(insights.data?.insights ?? []).map((i: { id?: string; title: string; body: string; severity: string }, idx: number) => (
            <div key={i.id ?? idx} className="rounded-xl border border-glass-border bg-white/[0.02] p-4">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${i.severity === "high" ? "bg-destructive" : i.severity === "warn" ? "bg-yellow-400" : "bg-primary"}`} />
                <div className="font-medium text-sm">{i.title}</div>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{i.body}</p>
            </div>
          ))}
          {!insights.data?.insights.length && (
            <p className="text-sm text-muted-foreground">No insights yet. Click Generate.</p>
          )}
        </div>
      </Card>

      <Card className="glass border-glass-border p-6">
        <h2 className="font-display text-lg font-semibold mb-4">Schema</h2>
        <div className="overflow-x-auto rounded-lg border border-glass-border">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.03] text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left p-2">Column</th>
                <th className="text-left p-2">Type</th>
                <th className="text-right p-2">Null %</th>
                <th className="text-right p-2">Unique</th>
              </tr>
            </thead>
            <tbody>
              {(ds.data?.columns ?? []).map((c) => (
                <tr key={c.id} className="border-t border-glass-border">
                  <td className="p-2 font-mono text-xs">{c.name}</td>
                  <td className="p-2"><span className="rounded bg-primary/15 px-2 py-0.5 text-xs text-primary">{c.dtype}</span></td>
                  <td className="p-2 text-right text-muted-foreground">{c.null_pct ?? 0}%</td>
                  <td className="p-2 text-right text-muted-foreground">{c.unique_count ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}