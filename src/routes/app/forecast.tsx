import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listDatasets, getDataset } from "@/lib/datasets.functions";
import { runForecast } from "@/lib/forecast.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { TrendingUp, Loader2, AlertTriangle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";

export const Route = createFileRoute("/app/forecast")({
  component: ForecastPage,
});

function ForecastPage() {
  const ds = useServerFn(listDatasets);
  const get = useServerFn(getDataset);
  const fc = useServerFn(runForecast);

  const datasets = useQuery({ queryKey: ["datasets"], queryFn: () => ds() });
  const [datasetId, setDatasetId] = useState<string>();
  const [target, setTarget] = useState("");
  const [time, setTime] = useState("");
  const [horizon, setHorizon] = useState(12);
  const [method, setMethod] = useState<"auto" | "arima" | "prophet" | "linear">("auto");

  useEffect(() => {
    if (!datasetId && datasets.data?.datasets[0]) setDatasetId(datasets.data.datasets[0].id);
  }, [datasets.data, datasetId]);

  const dataset = useQuery({
    queryKey: ["dataset", datasetId],
    queryFn: () => get({ data: { id: datasetId! } }),
    enabled: !!datasetId,
  });

  const mut = useMutation({
    mutationFn: () => fc({ data: { datasetId: datasetId!, targetCol: target, timeCol: time || undefined, horizon, method } }),
  });

  const cols = dataset.data?.columns ?? [];
  const numCols = cols.filter((c) => c.dtype === "number");
  const timeCols = cols.filter((c) => c.dtype === "date" || c.dtype === "string");

  const chartData = mut.data
    ? [
        ...mut.data.result.history.map((p) => ({ t: String(p.t), actual: p.y })),
        ...mut.data.result.forecast.map((p) => ({ t: String(p.t), forecast: p.yhat, lo: p.lo, hi: p.hi })),
      ]
    : [];
  const cutoff = mut.data?.result.history.length ? String(mut.data.result.history[mut.data.result.history.length - 1].t) : undefined;

  return (
    <div className="mx-auto max-w-7xl p-6 lg:p-10 space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" /> Forecasting
        </h1>
        <p className="text-sm text-muted-foreground">ARIMA, Prophet, and linear baselines — powered by your Python service.</p>
      </header>

      <Card className="glass border-glass-border p-6 grid gap-4 md:grid-cols-5">
        <div>
          <Label>Dataset</Label>
          <Select value={datasetId} onValueChange={setDatasetId}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{datasets.data?.datasets.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Target (numeric)</Label>
          <Select value={target} onValueChange={setTarget}>
            <SelectTrigger><SelectValue placeholder="Column" /></SelectTrigger>
            <SelectContent>{numCols.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Time column</Label>
          <Select value={time} onValueChange={setTime}>
            <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
            <SelectContent>{timeCols.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Horizon</Label>
          <Input type="number" min={1} max={365} value={horizon} onChange={(e) => setHorizon(+e.target.value)} />
        </div>
        <div>
          <Label>Method</Label>
          <Select value={method} onValueChange={(v) => setMethod(v as typeof method)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto</SelectItem>
              <SelectItem value="arima">ARIMA</SelectItem>
              <SelectItem value="prophet">Prophet</SelectItem>
              <SelectItem value="linear">Linear</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-5 flex justify-end">
          <Button disabled={!target || mut.isPending} onClick={() => mut.mutate()}
            className="bg-gradient-to-r from-primary to-accent-violet text-primary-foreground shadow-glow">
            {mut.isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
            Run forecast
          </Button>
        </div>
      </Card>

      {mut.data?.error && (
        <div className="flex items-center gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4 text-sm text-yellow-200">
          <AlertTriangle className="h-4 w-4" /> {mut.data.error}
        </div>
      )}

      {mut.data && chartData.length > 0 && (
        <Card className="glass border-glass-border p-6">
          <h2 className="font-display text-lg font-semibold mb-4">Result ({mut.data.result.method})</h2>
          <div style={{ width: "100%", height: 380 }}>
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid stroke="oklch(1 0 0 / 0.06)" strokeDasharray="3 3" />
                <XAxis dataKey="t" stroke="oklch(0.7 0.02 250)" tick={{ fontSize: 11 }} />
                <YAxis stroke="oklch(0.7 0.02 250)" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "oklch(0.18 0.02 260)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 8 }} />
                <Legend />
                {cutoff && <ReferenceLine x={cutoff} stroke="oklch(0.62 0.22 295)" strokeDasharray="4 4" />}
                <Line type="monotone" dataKey="actual" stroke="oklch(0.68 0.2 255)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="forecast" stroke="oklch(0.62 0.22 295)" strokeWidth={2} strokeDasharray="4 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
    </div>
  );
}