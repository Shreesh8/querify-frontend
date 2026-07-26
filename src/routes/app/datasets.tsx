import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { datasetsApi } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Database, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/datasets")({
  component: DatasetsLayout,
});

function DatasetsLayout() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  if (path !== "/app/datasets") return <Outlet />;
  return <DatasetsList />;
}

function DatasetsList() {
  const qc = useQueryClient();
  const { data: datasets = [], isLoading } = useQuery({
    queryKey: ["datasets"],
    queryFn: () => datasetsApi.list(),
  });

  const [confirmId, setConfirmId] = useState<string | null>(null);
  const mut = useMutation({
    mutationFn: (id: string) => datasetsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["datasets"] });
      setConfirmId(null);
      toast.success("Dataset deleted");
    },
    onError: () => toast.error("Failed to delete dataset"),
  });

  return (
    <div className="mx-auto max-w-7xl p-6 lg:p-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Datasets</h1>
          <p className="text-sm text-muted-foreground">CSV and Excel files ready for analysis.</p>
        </div>
        <Button asChild className="bg-gradient-to-r from-primary to-accent-violet text-primary-foreground shadow-glow">
          <Link to="/app/datasets/new"><Plus className="mr-1 h-4 w-4" /> Upload</Link>
        </Button>
      </div>

      {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(datasets as any[]).map((d) => (
          <Card key={d.id} className="glass border-glass-border p-5 group">
            <div className="flex items-start justify-between">
              <Link to="/app/datasets/$id" params={{ id: d.id }} className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-accent-violet/20">
                  <Database className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-medium">{d.name}</div>
                  <div className="text-xs text-muted-foreground">{d.original_filename}</div>
                </div>
              </Link>
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmId(d.id); }}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs">
              <Badge variant="secondary">{d.row_count?.toLocaleString()} rows</Badge>
              <Badge variant="secondary">{d.column_count} cols</Badge>
              <Badge variant="outline" className="ml-auto">{d.health_score}/100</Badge>
            </div>
          </Card>
        ))}
        {/* Confirmation dialog */}
      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass border border-glass-border rounded-2xl p-6 max-w-sm w-full mx-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <div className="font-semibold">Delete dataset?</div>
                <div className="text-xs text-muted-foreground">This will also delete all chat history for this dataset.</div>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setConfirmId(null)}>Cancel</Button>
              <Button size="sm" onClick={() => mut.mutate(confirmId)}
                disabled={mut.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {mut.isPending ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {!isLoading && !(datasets as any[]).length && (
          <Card className="glass border-glass-border p-10 sm:col-span-2 lg:col-span-3 text-center">
            <Database className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">No datasets yet.</p>
            <Button asChild className="mt-4 bg-gradient-to-r from-primary to-accent-violet text-primary-foreground shadow-glow">
              <Link to="/app/datasets/new">Upload your first dataset</Link>
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
