import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { ZoomIn } from "lucide-react";

export type ChartData =
  | { type: "pie"; labels: (string | number)[]; values: number[] }
  | { type: string; x: (string | number)[]; y: number[]; x_label: string; y_label: string };

const PIE_COLORS = ["#8b5cf6", "#06b6d4", "#f59e0b", "#10b981", "#ef4444", "#3b82f6", "#ec4899", "#84cc16"];
const tooltipStyle = { background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 };
const gridStyle = { stroke: "rgba(255,255,255,0.06)" };

function formatTick(val: any): string {
  if (typeof val === "number") {
    if (Math.abs(val) >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
    if (Math.abs(val) >= 1_000) return `${(val / 1_000).toFixed(1)}k`;
    return String(Math.round(val * 100) / 100);
  }
  const s = String(val);
  return s.length > 12 ? s.slice(0, 11) + "…" : s;
}

function XAxisEl({ dataKey, data }: { dataKey: string; data: any[] }) {
  const count = data.length;
  return (
    <XAxis dataKey={dataKey}
      tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11 }}
      tickLine={false}
      axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
      interval={count > 20 ? Math.floor(count / 10) : 0}
      angle={count > 8 ? -35 : 0}
      textAnchor={count > 8 ? "end" : "middle"}
      height={count > 8 ? 65 : 30}
      tickFormatter={formatTick}
    />
  );
}

function YAxisEl() {
  return (
    <YAxis tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11 }}
      tickLine={false} axisLine={false} tickFormatter={formatTick} width={55} />
  );
}

export function ChartInner({ chart, height = 280 }: { chart: ChartData; height?: number }) {
  if (chart.type === "pie") {
    const data = (chart as any).labels.map((label: any, i: number) => ({
      name: String(label), value: (chart as any).values[i]
    }));
    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%"
            outerRadius={height * 0.32}
            label={({ name, percent }) => `${formatTick(name)} ${(percent * 100).toFixed(0)}%`}
            labelLine={false}>
            {data.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }} />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  const c = chart as { type: string; x: any[]; y: number[]; x_label: string; y_label: string };
  const data = c.x.map((xVal, i) => ({ [c.x_label]: xVal, [c.y_label]: c.y[i] }));

  if (c.type === "line") return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" {...gridStyle} />
        <XAxisEl dataKey={c.x_label} data={data} />
        <YAxisEl />
        <Tooltip contentStyle={tooltipStyle} />
        <Line type="monotone" dataKey={c.y_label} stroke="#8b5cf6" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );

  if (c.type === "area") return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" {...gridStyle} />
        <XAxisEl dataKey={c.x_label} data={data} />
        <YAxisEl />
        <Tooltip contentStyle={tooltipStyle} />
        <Area type="monotone" dataKey={c.y_label} stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.15} />
      </AreaChart>
    </ResponsiveContainer>
  );

  if (c.type === "scatter") return (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" {...gridStyle} />
        <XAxis dataKey={c.x_label} name={c.x_label}
          tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11 }}
          tickLine={false} axisLine={{ stroke: "rgba(255,255,255,0.1)" }} tickFormatter={formatTick} />
        <YAxisEl />
        <Tooltip contentStyle={tooltipStyle} />
        <Scatter data={data} fill="#8b5cf6" fillOpacity={0.7} />
      </ScatterChart>
    </ResponsiveContainer>
  );

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" {...gridStyle} />
        <XAxisEl dataKey={c.x_label} data={data} />
        <YAxisEl />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey={c.y_label} fill="#8b5cf6" radius={[4, 4, 0, 0]}
          label={data.length <= 8 ? { position: "top", fill: "rgba(255,255,255,0.5)", fontSize: 10, formatter: formatTick } : undefined} />
      </BarChart>
    </ResponsiveContainer>
  );
}

interface ResultChartProps {
  chart?: ChartData | null;
  title?: string;
  clickable?: boolean;
}

export function ResultChart({ chart, title = "Chart", clickable = false, onInsightClick }: ResultChartProps & { onInsightClick?: () => void }) {
  if (!chart) return null;

  const handleClick = () => {
    if (!clickable || !onInsightClick) return;
    sessionStorage.setItem("querify_chart_insight", JSON.stringify({ chart, title }));
    onInsightClick();
  };

  return (
    <div className={clickable ? "relative group cursor-pointer" : ""} onClick={handleClick}>
      <ChartInner chart={chart} height={280} />
      {clickable && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/20 rounded-lg pointer-events-none">
          <div className="flex items-center gap-2 bg-black/70 px-3 py-1.5 rounded-full text-xs text-white">
            <ZoomIn className="h-3 w-3" /> Click for AI insights
          </div>
        </div>
      )}
    </div>
  );
}
