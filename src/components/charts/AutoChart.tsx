import {
  ResponsiveContainer,
  BarChart, Bar,
  LineChart, Line,
  AreaChart, Area,
  PieChart, Pie, Cell,
  ScatterChart, Scatter,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";
import type { ChartSpec } from "@/lib/charts/types";

const COLORS = [
  "oklch(0.68 0.2 255)",
  "oklch(0.62 0.22 295)",
  "oklch(0.72 0.18 200)",
  "oklch(0.7 0.2 330)",
  "oklch(0.65 0.2 150)",
];

export function AutoChart({ spec, height = 280 }: { spec: ChartSpec; height?: number }) {
  const ys = Array.isArray(spec.y) ? spec.y : [spec.y];
  const common = (
    <>
      <CartesianGrid stroke="oklch(1 0 0 / 0.06)" strokeDasharray="3 3" />
      <XAxis dataKey={spec.x} stroke="oklch(0.7 0.02 250)" tick={{ fontSize: 11 }} />
      <YAxis stroke="oklch(0.7 0.02 250)" tick={{ fontSize: 11 }} />
      <Tooltip contentStyle={{ background: "oklch(0.18 0.02 260)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 8, fontSize: 12 }} />
      <Legend wrapperStyle={{ fontSize: 12 }} />
    </>
  );

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        {spec.kind === "bar" ? (
          <BarChart data={spec.data}>{common}{ys.map((y, i) => (
            <Bar key={y} dataKey={y} fill={COLORS[i % COLORS.length]} radius={[6,6,0,0]} stackId={spec.stacked ? "a" : undefined} />
          ))}</BarChart>
        ) : spec.kind === "line" ? (
          <LineChart data={spec.data}>{common}{ys.map((y, i) => (
            <Line key={y} type={spec.smooth ? "monotone" : "linear"} dataKey={y} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={false} />
          ))}</LineChart>
        ) : spec.kind === "area" ? (
          <AreaChart data={spec.data}>{common}{ys.map((y, i) => (
            <Area key={y} type="monotone" dataKey={y} stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} fillOpacity={0.2} />
          ))}</AreaChart>
        ) : spec.kind === "scatter" ? (
          <ScatterChart>{common}<Scatter data={spec.data} fill={COLORS[0]} /></ScatterChart>
        ) : (
          <PieChart>
            <Pie data={spec.data} dataKey={ys[0]} nameKey={spec.x} outerRadius={100} label>
              {spec.data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ background: "oklch(0.18 0.02 260)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 8 }} />
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}