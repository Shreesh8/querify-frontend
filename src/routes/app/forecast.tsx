import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { datasetsApi, forecastApi } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { TrendingUp, Loader2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export const Route = createFileRoute("/app/forecast")({
  component: ForecastPage,
});

function ForecastPage() {
  const { data: datasets = [] } = useQuery({
    queryKey: ["datasets"],
    queryFn: () => datasetsApi.list(),
  });

  const [datasetId, setDatasetId] = useState("");
  const [target, setTarget] = useState("");
  const [dateCol, setDateCol] = useState("date");
  const [periods, setPeriods] = useState(30);
  const [frequency, setFrequency] = useState("D");

  useEffect(() => {
    if (!datasetId && (datasets as any[]).length) {
      setDatasetId((datasets as any[])[0].id);
    }
  }, [datasets, datasetId]);

  const preview = useQuery({
    queryKey: ["preview", datasetId],
    queryFn: () => datasetsApi.preview(datasetId),
    enabled: !!datasetId,
  });

  const cols = (preview.data as any)?.columns ?? [];
  const numCols = cols.filter((c: any) => c.is_numeric);
  const dateCols = cols.filter((c: any) => !c.is_numeric);

  const mut = useMutation({
    mutationFn: () => forecastApi.generate({
      dataset_id: datasetId,
      date_column: dateCol,
      target_column: target,
      periods,
      frequency,
    }),
  });

  const forecastData = mut.data as any;
  const chartData = forecastData?.forecast_points?.map((p: any) => ({
    date: p.ds,
    forecast: p.yhat,
    lower: p.yhat_lower,
    upper: p.yhat_upper,
  })) ?? [];

  return (
    <div className="mx-auto max-w-7xl p-6 lg:p-10 space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" /> Forecasting
        </h1>
        <p className="text-sm text-muted-foreground">Prophet time-series forecasting with confidence intervals.</p>
      </header>

      <Card className="glass border-glass-border p-6 grid gap-4 md:grid-cols-5">
        <div>
          <Label>Dataset</Label>
          <Select value={datasetId} onValueChange={setDatasetId}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {(datasets as any[]).map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Date column</Label>
          <Select value={dateCol} onValueChange={setDateCol}>
            <SelectTrigger><SelectValue placeholder="Date col" /></SelectTrigger>
            <SelectContent>
              {dateCols.map((c: any) => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Target (numeric)</Label>
          <Select value={target} onValueChange={setTarget}>
            <SelectTrigger><SelectValue placeholder="Column" /></SelectTrigger>
            <SelectContent>
              {numCols.map((c: any) => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Periods</Label>
          <Input type="number" min={7} max={365} value={periods} onChange={(e) => setPeriods(+e.target.value)} />
        </div>
        <div>
          <Label>Frequency</Label>
          <Select value={frequency} onValueChange={setFrequency}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="D">Daily</SelectItem>
              <SelectItem value="W">Weekly</SelectItem>
              <SelectItem value="M">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-5 flex justify-end">
          <Button disabled={!target || !datasetId || mut.isPending} onClick={() => mut.mutate()}
            className="bg-gradient-to-r from-primary to-accent-violet text-primary-foreground shadow-glow">
            {mut.isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
            Run forecast
          </Button>
        </div>
      </Card>

      {mut.isError && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
          {(mut.error as Error).message}
        </div>
      )}

      {chartData.length > 0 && (
        <Card className="glass border-glass-border p-6">
          <h2 className="font-display text-lg font-semibold mb-4">
            Forecast — {target} ({periods} periods, {frequency})
          </h2>
          {forecastData?.model_metrics && (
            <div className="mb-4 flex gap-4 text-xs text-muted-foreground">
              <span>MAE: {forecastData.model_metrics.mae}</span>
              <span>RMSE: {forecastData.model_metrics.rmse}</span>
              <span>Training rows: {forecastData.model_metrics.training_rows}</span>
            </div>
          )}
          <div style={{ width: "100%", height: 380 }}>
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid stroke="oklch(1 0 0 / 0.06)" strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke="oklch(0.7 0.02 250)" tick={{ fontSize: 11 }} />
                <YAxis stroke="oklch(0.7 0.02 250)" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "oklch(0.18 0.02 260)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 8 }} />
                <Legend />
                <Line type="monotone" dataKey="forecast" stroke="oklch(0.62 0.22 295)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="upper" stroke="oklch(0.62 0.22 295/0.3)" strokeWidth={1} dot={false} strokeDasharray="3 3" />
                <Line type="monotone" dataKey="lower" stroke="oklch(0.62 0.22 295/0.3)" strokeWidth={1} dot={false} strokeDasharray="3 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
    </div>
  );
}
