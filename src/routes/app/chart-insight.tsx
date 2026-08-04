import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ResultChart } from "@/components/charts/ResultChart";
import { auth } from "@/lib/firebase";

export const Route = createFileRoute("/app/chart-insight")({
  component: ChartInsightPage,
});

function ChartInsightPage() {
  const navigate = useNavigate();
  const [chartData, setChartData] = useState<any>(null);
  const [title, setTitle] = useState("Chart");
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("querify_chart_insight");
    if (!stored) {
      navigate({ to: "/app/dashboards" });
      return;
    }
    const { chart, title: t } = JSON.parse(stored);
    setChartData(chart);
    setTitle(t);
    fetchInsight(chart, t);
  }, []);

  async function fetchInsight(chart: any, t: string) {
    setLoading(true);
    try {
      const summary =
        chart.type === "pie"
          ? `Pie chart of ${chart.labels?.slice(0, 5).join(", ")} with values ${chart.values?.slice(0, 5).join(", ")}`
          : `${chart.type} chart: ${chart.x_label} vs ${chart.y_label}. Top values: ${chart.x
              ?.slice(0, 5)
              .map((x: any, i: number) => `${x}=${chart.y?.[i]}`)
              .join(", ")}`;
      const token = (await auth.currentUser?.getIdToken()) ?? null;
      const base = (import.meta as any).env?.VITE_API_BASE_URL ?? "https://api.querify.site";
      const res = await fetch(`${base}/api/v1/chat/chart-insight`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: t, summary }),
      });
      const data = await res.json();
      setInsight(data.insight ?? "No insight available.");
    } catch {
      setInsight("Could not generate insight for this chart.");
    } finally {
      setLoading(false);
    }
  }

  if (!chartData) return <div className="p-10 text-muted-foreground text-sm">Loading…</div>;

  return (
    <div className="mx-auto max-w-5xl p-6 lg:p-10 space-y-6">
      <button
        onClick={() => navigate({ to: "/app/dashboards" })}
        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition"
      >
        <ArrowLeft className="h-3 w-3" /> Back to Dashboards
      </button>

      <h1 className="font-display text-2xl font-semibold">{title}</h1>

      {/* Chart */}
      <Card className="glass border-glass-border p-6">
        <ResultChart chart={chartData} />
      </Card>

      {/* AI Insight */}
      <Card className="glass border-glass-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <h2 className="font-display text-lg font-semibold">AI Insight</h2>
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>

        {loading ? (
          <div className="space-y-3">
            <div className="h-3 bg-white/5 rounded-full animate-pulse w-full" />
            <div className="h-3 bg-white/5 rounded-full animate-pulse w-[90%]" />
            <div className="h-3 bg-white/5 rounded-full animate-pulse w-[80%]" />
            <div className="h-3 bg-white/5 rounded-full animate-pulse w-[85%]" />
            <div className="h-3 bg-white/5 rounded-full animate-pulse w-[75%]" />
          </div>
        ) : (
          <p className="text-sm text-foreground/80 leading-8">{insight}</p>
        )}
      </Card>
    </div>
  );
}
