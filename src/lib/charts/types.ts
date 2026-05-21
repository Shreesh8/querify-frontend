export type ChartKind = "bar" | "line" | "area" | "pie" | "scatter";

export interface ChartSpec {
  kind: ChartKind;
  title?: string;
  x: string;          // column name
  y: string | string[]; // column(s)
  data: Array<Record<string, string | number | null>>;
  stacked?: boolean;
  smooth?: boolean;
}