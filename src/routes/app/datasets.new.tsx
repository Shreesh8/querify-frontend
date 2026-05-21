import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createDataset } from "@/lib/datasets.functions";
import { parseFile, type ParseResult } from "@/lib/parse-file";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileSpreadsheet, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/datasets/new")({
  component: NewDatasetPage,
});

function NewDatasetPage() {
  const navigate = useNavigate();
  const create = useServerFn(createDataset);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const [busy, setBusy] = useState(false);

  const onPick = async (f: File) => {
    setFile(f);
    setName(f.name.replace(/\.[^.]+$/, ""));
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
      const { data: u } = await supabase.auth.getUser();
      const path = `${u.user!.id}/${Date.now()}-${file.name}`;
      const up = await supabase.storage.from("datasets").upload(path, file, { upsert: false });
      if (up.error) throw up.error;
      const res = await create({
        data: {
          name,
          source_filename: file.name,
          storage_path: path,
          row_count: parsed.rowCount,
          col_count: parsed.columns.length,
          columns: parsed.columns,
        },
      });
      toast.success("Dataset created");
      navigate({ to: "/app/datasets/$id", params: { id: res.id } });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl p-6 lg:p-10 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Upload a dataset</h1>
        <p className="text-sm text-muted-foreground">CSV, TSV, or XLSX. Parsed locally for instant preview.</p>
      </div>

      {!parsed ? (
        <label className="block">
          <div className="glass border-glass-border rounded-2xl border-2 border-dashed p-16 text-center cursor-pointer hover:border-primary/50 transition">
            <Upload className="mx-auto h-10 w-10 text-primary" />
            <p className="mt-4 font-medium">Click to browse or drop a file</p>
            <p className="text-xs text-muted-foreground mt-1">Max 50MB · CSV, TSV, XLSX</p>
          </div>
          <input
            type="file"
            accept=".csv,.tsv,.txt,.xlsx,.xls"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && onPick(e.target.files[0])}
          />
        </label>
      ) : (
        <Card className="glass border-glass-border p-6 space-y-6">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-8 w-8 text-primary" />
            <div>
              <div className="font-medium">{file?.name}</div>
              <div className="text-xs text-muted-foreground">
                {parsed.rowCount.toLocaleString()} rows · {parsed.columns.length} columns
              </div>
            </div>
          </div>

          <div>
            <Label>Dataset name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Schema</div>
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
                      <td className="p-2 text-right text-muted-foreground">{c.null_pct}%</td>
                      <td className="p-2 text-right text-muted-foreground">{c.unique_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Preview (first 10 rows)</div>
            <div className="overflow-x-auto rounded-lg border border-glass-border max-h-72">
              <table className="w-full text-xs">
                <thead className="bg-white/[0.03] sticky top-0">
                  <tr>{parsed.columns.map((c) => <th key={c.name} className="text-left p-2 font-mono">{c.name}</th>)}</tr>
                </thead>
                <tbody>
                  {parsed.preview.slice(0, 10).map((row, i) => (
                    <tr key={i} className="border-t border-glass-border">
                      {parsed.columns.map((c) => (
                        <td key={c.name} className="p-2 whitespace-nowrap">{String((row as Record<string, unknown>)[c.name] ?? "")}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <Button variant="ghost" onClick={() => { setParsed(null); setFile(null); }}>Cancel</Button>
            <Button onClick={submit} disabled={busy} className="bg-gradient-to-r from-primary to-accent-violet text-primary-foreground shadow-glow">
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save dataset
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}