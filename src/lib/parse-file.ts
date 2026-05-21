import Papa from "papaparse";
import * as XLSX from "xlsx";

export type Dtype = "number" | "string" | "boolean" | "date" | "unknown";

export interface ColumnStat {
  name: string;
  dtype: Dtype;
  null_pct: number;
  unique_count: number;
  stats: Record<string, number | string>;
}

export interface ParseResult {
  rows: Array<Record<string, unknown>>;
  columns: ColumnStat[];
  rowCount: number;
  preview: Array<Record<string, unknown>>;
}

function inferDtype(values: unknown[]): Dtype {
  let n = 0, s = 0, b = 0, d = 0, total = 0;
  for (const v of values) {
    if (v === null || v === undefined || v === "") continue;
    total++;
    if (typeof v === "number" || (!isNaN(Number(v)) && String(v).trim() !== "")) n++;
    else if (v === true || v === false || v === "true" || v === "false") b++;
    else if (!isNaN(Date.parse(String(v)))) d++;
    else s++;
  }
  if (!total) return "unknown";
  if (n / total > 0.85) return "number";
  if (b / total > 0.85) return "boolean";
  if (d / total > 0.85 && s === 0) return "date";
  return "string";
}

function computeStats(rows: Array<Record<string, unknown>>): ColumnStat[] {
  if (!rows.length) return [];
  const names = Object.keys(rows[0]);
  return names.map((name) => {
    const values = rows.map((r) => r[name]);
    const nonNull = values.filter((v) => v !== null && v !== undefined && v !== "");
    const dtype = inferDtype(values);
    const uniq = new Set(nonNull.map((v) => String(v))).size;
    const stats: Record<string, number | string> = {};
    if (dtype === "number") {
      const nums = nonNull.map(Number).filter((n) => !isNaN(n));
      if (nums.length) {
        const sum = nums.reduce((a, b) => a + b, 0);
        stats.min = Math.min(...nums);
        stats.max = Math.max(...nums);
        stats.mean = +(sum / nums.length).toFixed(3);
      }
    }
    return {
      name,
      dtype,
      null_pct: +(((values.length - nonNull.length) / values.length) * 100).toFixed(2),
      unique_count: uniq,
      stats,
    };
  });
}

export async function parseFile(file: File): Promise<ParseResult> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  let rows: Array<Record<string, unknown>> = [];

  if (ext === "csv" || ext === "tsv" || ext === "txt") {
    const text = await file.text();
    const out = Papa.parse<Record<string, unknown>>(text, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
    });
    rows = out.data;
  } else if (ext === "xlsx" || ext === "xls") {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json(sheet, { defval: null });
  } else {
    throw new Error("Unsupported file. Upload CSV, TSV, or XLSX.");
  }

  const columns = computeStats(rows);
  return {
    rows,
    columns,
    rowCount: rows.length,
    preview: rows.slice(0, 50),
  };
}