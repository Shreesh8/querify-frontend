import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { uploadDataset } from "@/lib/datasets.functions";
import { parseFile, type ParseResult } from "@/lib/parse-file";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Upload, FileSpreadsheet, Loader2, Sparkles, Download, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import Papa from "papaparse";

export const Route = createFileRoute("/app/datasets/new")({
  component: NewDatasetPage,
});

interface CleanOptions {
  removeDuplicates: boolean;
  dropHighNullCols: boolean;
  highNullThreshold: number;
  fillNumericNulls: "none" | "mean" | "median" | "zero";
  standardizeColNames: boolean;
}

function cleanRows(
  rows: Array<Record<string, unknown>>,
  columns: ParseResult["columns"],
  opts: CleanOptions
): { rows: Array<Record<string, unknown>>; log: string[] } {
  const log: string[] = [];
  let data = [...rows.map((r) => ({ ...r }))];
  const originalRows = data.length;

  // 1. Standardize column names
  let colMap: Record<string, string> = {};
  if (opts.standardizeColNames) {
    columns.forEach((c) => {
      const cleaned = c.name.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
      if (cleaned !== c.name) colMap[c.name] = cleaned;
    });
    if (Object.keys(colMap).length > 0) {
      data = data.map((row) => {
        const newRow: Record<string, unknown> = {};
        Object.entries(row).forEach(([k, v]) => { newRow[colMap[k] ?? k] = v; });
        return newRow;
      });
      log.push(`Renamed ${Object.keys(colMap).length} columns to snake_case`);
    }
  }

  // 2. Drop high-null columns
  let droppedCols: string[] = [];
  if (opts.dropHighNullCols) {
    droppedCols = columns
      .filter((c) => c.null_pct >= opts.highNullThreshold)
      .map((c) => colMap[c.name] ?? c.name);
    if (droppedCols.length > 0) {
      data = data.map((row) => {
        const newRow = { ...row };
        droppedCols.forEach((col) => delete newRow[col]);
        return newRow;
      });
      log.push(`Dropped ${droppedCols.length} columns with ≥${opts.highNullThreshold}% nulls: ${droppedCols.join(", ")}`);
    }
  }

  // 3. Fill numeric nulls
  if (opts.fillNumericNulls !== "none") {
    const numericCols = columns
      .filter((c) => c.dtype === "number" && !droppedCols.includes(colMap[c.name] ?? c.name))
      .map((c) => ({ ...c, mappedName: colMap[c.name] ?? c.name }));

    numericCols.forEach(({ mappedName }) => {
      const vals = data.map((r) => r[mappedName]).filter((v) => v !== null && v !== undefined && v !== "" && !isNaN(Number(v))).map(Number);
      if (!vals.length) return;
      let fill: number;
      if (opts.fillNumericNulls === "mean") fill = vals.reduce((a, b) => a + b, 0) / vals.length;
      else if (opts.fillNumericNulls === "median") { const s = [...vals].sort((a, b) => a - b); fill = s[Math.floor(s.length / 2)]; }
      else fill = 0;
      fill = +fill.toFixed(4);
      let filled = 0;
      data = data.map((row) => {
        const v = row[mappedName];
        if (v === null || v === undefined || v === "") { filled++; return { ...row, [mappedName]: fill }; }
        return row;
      });
      if (filled > 0) log.push(`Filled ${filled} nulls in '${mappedName}' with ${opts.fillNumericNulls} (${fill})`);
    });
  }

  // 4. Remove duplicates
  if (opts.removeDuplicates) {
    const seen = new Set<string>();
    const deduped = data.filter((row) => {
      const key = JSON.stringify(row);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    const removed = data.length - deduped.length;
    if (removed > 0) log.push(`Removed ${removed} duplicate rows`);
    data = deduped;
  }

  if (data.length !== originalRows && !log.some((l) => l.includes("duplicate"))) {
    log.push(`Rows: ${originalRows} → ${data.length}`);
  }

  return { rows: data, log };
}

function downloadCSV(rows: Array<Record<string, unknown>>, filename: string) {
  const csv = Papa.unparse(rows);
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function rowsToFile(rows: Array<Record<string, unknown>>, filename: string): File {
  const csv = Papa.unparse(rows);
  return new File([csv], filename, { type: "text/csv" });
}

function NewDatasetPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [showCleaner, setShowCleaner] = useState(false);
  const [useCleaned, setUseCleaned] = useState(false);
  const [opts, setOpts] = useState<CleanOptions>({
    removeDuplicates: true,
    dropHighNullCols: false,
    highNullThreshold: 50,
    fillNumericNulls: "none",
    standardizeColNames: false,
  });

  const cleaned = useMemo(() => {
    if (!parsed || !showCleaner) return null;
    return cleanRows(parsed.rows, parsed.columns, opts);
  }, [parsed, opts, showCleaner]);

  const onPick = async (f: File) => {
    setFile(f);
    setName(f.name.replace(/\.[^.]+$/, ""));
    setUseCleaned(false);
    setShowCleaner(false);
    try {
      const r = await parseFile(f);
      setParsed(r);
      toast.success(`Parsed ${r.rowCount.toLocaleString()} rows`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const submit = async () => {
    if (!file || !parsed) return;
    setBusy(true);
    try {
      const uploadFile = useCleaned && cleaned
        ? rowsToFile(cleaned.rows, name + "_cleaned.csv")
        : file;
      const res = await uploadDataset(uploadFile, name + (useCleaned ? "_cleaned" : ""));
      toast.success("Dataset uploaded successfully");
      navigate({ to: "/app/datasets/$id", params: { id: (res as { id: string }).id } });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const opt = (key: keyof CleanOptions, val: any) => setOpts((o) => ({ ...o, [key]: val }));

  return (
    <div className="mx-auto max-w-5xl p-6 lg:p-10 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Upload a dataset</h1>
        <p className="text-sm text-muted-foreground">CSV or XLSX. Processed by your AI analytics engine.</p>
      </div>

      {!parsed ? (
        <label className="block">
          <div className="glass border-glass-border rounded-2xl border-2 border-dashed p-16 text-center cursor-pointer hover:border-primary/50 transition">
            <Upload className="mx-auto h-10 w-10 text-primary" />
            <p className="mt-4 font-medium">Click to browse or drop a file</p>
            <p className="text-xs text-muted-foreground mt-1">Max 50MB · CSV, XLSX</p>
          </div>
          <input type="file" accept=".csv,.xlsx,.xls" className="hidden"
            onChange={(e) => e.target.files?.[0] && onPick(e.target.files[0])} />
        </label>
      ) : (
        <div className="space-y-4">
          <Card className="glass border-glass-border p-6 space-y-6">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="h-8 w-8 text-primary" />
              <div className="flex-1">
                <div className="font-medium">{file?.name}</div>
                <div className="text-xs text-muted-foreground">
                  {parsed.rowCount.toLocaleString()} rows · {parsed.columns.length} columns
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowCleaner(!showCleaner)}
                className={showCleaner ? "border-primary text-primary" : ""}>
                <Sparkles className="mr-1 h-3 w-3" />
                {showCleaner ? "Hide cleaner" : "Clean data"}
              </Button>
            </div>

            <div>
              <Label>Dataset name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
            </div>

            {/* Schema preview */}
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Schema preview</div>
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
                    {parsed.columns.map((c) => (
                      <tr key={c.name} className="border-t border-glass-border">
                        <td className="p-2 font-mono text-xs">{c.name}</td>
                        <td className="p-2"><span className="rounded bg-primary/15 px-2 py-0.5 text-xs text-primary">{c.dtype}</span></td>
                        <td className={`p-2 text-right ${c.null_pct > 20 ? "text-yellow-400" : "text-muted-foreground"}`}>{c.null_pct}%</td>
                        <td className="p-2 text-right text-muted-foreground">{c.unique_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center gap-2 justify-end">
              <Button variant="ghost" onClick={() => { setParsed(null); setFile(null); setShowCleaner(false); setUseCleaned(false); }}>Cancel</Button>
              <Button onClick={submit} disabled={busy}
                className="bg-gradient-to-r from-primary to-accent-violet text-primary-foreground shadow-glow">
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {useCleaned ? "Upload cleaned dataset" : "Upload & analyze"}
              </Button>
            </div>
          </Card>

          {/* Data Cleaner Panel */}
          {showCleaner && (
            <Card className="glass border-glass-border p-6 space-y-5 border-primary/20">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h2 className="font-display text-lg font-semibold">Data Cleaner</h2>
                <Badge variant="outline" className="ml-auto text-xs">
                  {parsed.rowCount.toLocaleString()} → {cleaned?.rows.length.toLocaleString() ?? parsed.rowCount.toLocaleString()} rows
                </Badge>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Remove duplicates */}
                <label className="flex items-start gap-3 p-3 rounded-lg border border-glass-border bg-white/[0.02] cursor-pointer hover:border-primary/30 transition">
                  <input type="checkbox" checked={opts.removeDuplicates}
                    onChange={(e) => opt("removeDuplicates", e.target.checked)}
                    className="mt-0.5 accent-violet-500" />
                  <div>
                    <div className="text-sm font-medium">Remove duplicate rows</div>
                    <div className="text-xs text-muted-foreground">Delete exact duplicate rows</div>
                  </div>
                </label>

                {/* Standardize column names */}
                <label className="flex items-start gap-3 p-3 rounded-lg border border-glass-border bg-white/[0.02] cursor-pointer hover:border-primary/30 transition">
                  <input type="checkbox" checked={opts.standardizeColNames}
                    onChange={(e) => opt("standardizeColNames", e.target.checked)}
                    className="mt-0.5 accent-violet-500" />
                  <div>
                    <div className="text-sm font-medium">Standardize column names</div>
                    <div className="text-xs text-muted-foreground">Convert to lowercase snake_case</div>
                  </div>
                </label>

                {/* Drop high-null columns */}
                <label className="flex items-start gap-3 p-3 rounded-lg border border-glass-border bg-white/[0.02] cursor-pointer hover:border-primary/30 transition">
                  <input type="checkbox" checked={opts.dropHighNullCols}
                    onChange={(e) => opt("dropHighNullCols", e.target.checked)}
                    className="mt-0.5 accent-violet-500" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">Drop high-null columns</div>
                    <div className="text-xs text-muted-foreground mb-2">Remove columns above null threshold</div>
                    {opts.dropHighNullCols && (
                      <div className="flex items-center gap-2 mt-1">
                        <input type="range" min={10} max={90} step={5} value={opts.highNullThreshold}
                          onChange={(e) => opt("highNullThreshold", Number(e.target.value))}
                          className="flex-1 accent-violet-500" />
                        <span className="text-xs font-mono w-10 text-right">{opts.highNullThreshold}%</span>
                      </div>
                    )}
                  </div>
                </label>

                {/* Fill numeric nulls */}
                <div className="p-3 rounded-lg border border-glass-border bg-white/[0.02]">
                  <div className="text-sm font-medium mb-1">Fill numeric nulls</div>
                  <div className="text-xs text-muted-foreground mb-2">Replace missing numeric values</div>
                  <div className="flex gap-1 flex-wrap">
                    {(["none", "mean", "median", "zero"] as const).map((v) => (
                      <button key={v} onClick={() => opt("fillNumericNulls", v)}
                        className={`px-2 py-1 rounded text-xs transition ${opts.fillNumericNulls === v
                          ? "bg-primary text-primary-foreground"
                          : "border border-glass-border text-muted-foreground hover:border-primary/50"}`}>
                        {v === "none" ? "Don't fill" : v.charAt(0).toUpperCase() + v.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Cleaning log */}
              {cleaned && cleaned.log.length > 0 && (
                <div className="rounded-lg bg-white/[0.02] border border-glass-border p-4 space-y-1">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Changes preview</div>
                  {cleaned.log.map((l, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-3 w-3 text-green-400 shrink-0" />
                      <span>{l}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2 justify-end pt-2 border-t border-glass-border">
                <Button variant="outline" size="sm"
                  onClick={() => cleaned && downloadCSV(cleaned.rows, name + "_cleaned.csv")}
                  disabled={!cleaned || cleaned.log.length === 0}>
                  <Download className="mr-1 h-3 w-3" /> Download cleaned CSV
                </Button>
                <Button size="sm"
                  onClick={() => { setUseCleaned(true); toast.success("Cleaned dataset will be uploaded"); }}
                  disabled={!cleaned || cleaned.log.length === 0}
                  className={`bg-gradient-to-r from-primary to-accent-violet text-primary-foreground shadow-glow ${useCleaned ? "opacity-70" : ""}`}>
                  {useCleaned ? <><CheckCircle2 className="mr-1 h-3 w-3" /> Using cleaned</> : "Use cleaned for upload"}
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
