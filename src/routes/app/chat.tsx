import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { datasetsApi, chatApi, suggestionsApi } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Send, Sparkles, Loader2, BarChart2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { ResultChart } from "@/components/charts/ResultChart";

export const Route = createFileRoute("/app/chat")({
  component: ChatPage,
});

type Message = { role: "user" | "assistant"; content: string; result_data?: any };

function AssistantResult({ result_data }: { result_data: any }) {
  const [showChart, setShowChart] = useState(false);
  const rows = result_data?.rows ?? [];
  const chart = result_data?.chart;
  const cols = rows.length > 0 ? Object.keys(rows[0]) : [];

  return (
    <div className="mt-3 space-y-2">
      {/* Tabular text result */}
      {rows.length > 0 && rows.length <= 20 && (
        <div className="rounded-lg border border-glass-border overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-white/[0.04] text-muted-foreground">
              <tr>{cols.map(c => <th key={c} className="text-left px-3 py-2 font-medium">{c}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((row: any, i: number) => (
                <tr key={i} className="border-t border-glass-border hover:bg-white/[0.02]">
                  {cols.map(c => <td key={c} className="px-3 py-2 text-foreground/80">{String(row[c] ?? "—")}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {rows.length > 20 && (
        <div className="text-xs text-muted-foreground px-1">{rows.length} rows returned</div>
      )}
      {/* Optional chart toggle */}
      {chart && (
        <div>
          <button onClick={() => setShowChart(v => !v)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition px-1">
            <BarChart2 className="h-3 w-3" />
            {showChart ? "Hide chart" : "Show chart"}
            {showChart ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
          {showChart && (
            <div className="mt-2 p-3 rounded-lg bg-white/[0.02] border border-glass-border">
              <ResultChart chart={chart} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ChatPage() {
  const { data: datasets = [] } = useQuery({
    queryKey: ["datasets"],
    queryFn: () => datasetsApi.list(),
  });

  const [datasetId, setDatasetId] = useState<string>("");

  const suggestions = useQuery({
    queryKey: ["suggestions", datasetId],
    queryFn: () => suggestionsApi.get(datasetId),
    enabled: !!datasetId,
    staleTime: Infinity,
  });
  const exampleQueries = suggestions.data?.suggestions ?? ["Which category has the most entries?", "Show top 5 rows by value", "Count by category"];
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!datasetId && (datasets as any[]).length) {
      setDatasetId((datasets as any[])[0].id);
    }
  }, [datasets, datasetId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMut = useMutation({
    mutationFn: async (question: string) => {
      if (!datasetId) throw new Error("Pick a dataset first");
      return chatApi.query(datasetId, question);
    },
    onSuccess: (data: any) => {
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: data.answer,
        result_data: data.result_data,
      }]);
    },
    onError: (e: any) => {
      const detail = e?.response?.data?.detail || e?.detail;
      if (detail?.error === "limit_exceeded") {
        const subject = encodeURIComponent("Querify Pro Upgrade Request");
        const body = encodeURIComponent(
          `Hi Shreesh,\n\nI've used ${detail.used}/${detail.limit} of my monthly queries on Querify and would like to request an upgrade.\n\nPlease approve an increased limit for my account.\n\nThank you!`
        );
        setMessages((prev) => [...prev, {
          role: "assistant",
          content: `⚡ You've used all ${detail.limit} queries for this month. Click below to request an upgrade.`,
        }]);
        setTimeout(() => {
          if (window.confirm("You've hit your query limit! Would you like to send an upgrade request email?")) {
            window.open(`mailto:dwivedishreesh8@gmail.com?subject=${subject}&body=${body}`);
          }
        }, 300);
      } else {
        setMessages((prev) => [...prev, {
          role: "assistant",
          content: "Something went wrong. Please try again.",
        }]);
      }
    },
  });

  const submit = () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { role: "user", content: input.trim() }]);
    sendMut.mutate(input.trim());
    setInput("");
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <div className="border-b border-glass-border p-4 flex items-center gap-4">
        <Select value={datasetId} onValueChange={setDatasetId}>
          <SelectTrigger className="w-64"><SelectValue placeholder="Choose dataset" /></SelectTrigger>
          <SelectContent>
            {(datasets as any[]).map((d) => (
              <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">Ask questions about your data in plain English</span>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {!messages.length && (
          <div className="flex h-full items-center justify-center text-center">
            <div className="max-w-md">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent-violet shadow-glow">
                <Sparkles className="h-6 w-6 text-primary-foreground" />
              </div>
              <h2 className="mt-4 font-display text-xl font-semibold">Ask anything about your data</h2>
              <div className="mt-3 flex flex-col gap-2">
                {suggestions.isLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Generating suggestions…</div>
                ) : (
                  exampleQueries.map((q: string) => (
                    <button key={q} onClick={() => setInput(q)}
                      className="text-sm text-left px-3 py-2 rounded-lg border border-glass-border bg-white/[0.02] hover:bg-white/[0.05] text-muted-foreground hover:text-foreground transition cursor-pointer">
                      {q}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <Card className={`glass border-glass-border p-4 max-w-2xl ${m.role === "user" ? "bg-primary/10" : ""}`}>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{m.role}</div>
              <div className="text-sm whitespace-pre-wrap">{m.content}</div>
              {m.result_data?.rows && m.result_data.rows.length > 0 && m.role === "assistant" && (
                <AssistantResult result_data={m.result_data} />
              )}
            </Card>
          </div>
        ))}

        {sendMut.isPending && (
          <div className="flex justify-start">
            <Card className="glass border-glass-border p-4">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </Card>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-glass-border bg-background/60 backdrop-blur-xl p-4">
        <div className="mx-auto max-w-3xl">
          <div className="glass border-glass-border rounded-2xl border p-2 flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
              placeholder="Ask about trends, anomalies, top values…"
              className="min-h-[44px] border-0 bg-transparent focus-visible:ring-0 resize-none"
              rows={1}
            />
            <Button onClick={submit} disabled={sendMut.isPending || !datasetId}
              className="bg-gradient-to-r from-primary to-accent-violet text-primary-foreground shadow-glow">
              {sendMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
