import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listDatasets } from "@/lib/datasets.functions";
import { listConversations, getConversation, createConversation, sendMessage } from "@/lib/chat.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Send, Sparkles, MessageSquare, Plus, Loader2 } from "lucide-react";
import { AutoChart } from "@/components/charts/AutoChart";
import type { ChartSpec } from "@/lib/charts/types";
import { toast } from "sonner";

export const Route = createFileRoute("/app/chat")({
  component: ChatPage,
});

function ChatPage() {
  const ds = useServerFn(listDatasets);
  const lc = useServerFn(listConversations);
  const gc = useServerFn(getConversation);
  const cc = useServerFn(createConversation);
  const sm = useServerFn(sendMessage);
  const qc = useQueryClient();

  const datasets = useQuery({ queryKey: ["datasets"], queryFn: () => ds() });
  const [datasetId, setDatasetId] = useState<string | undefined>();
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [input, setInput] = useState("");

  useEffect(() => {
    if (!datasetId && datasets.data?.datasets[0]) setDatasetId(datasets.data.datasets[0].id);
  }, [datasets.data, datasetId]);

  const conversations = useQuery({
    queryKey: ["conversations", datasetId],
    queryFn: () => lc({ data: { datasetId } }),
    enabled: !!datasetId,
  });

  const convo = useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: () => gc({ data: { id: conversationId! } }),
    enabled: !!conversationId,
  });

  const sendMut = useMutation({
    mutationFn: async (content: string) => {
      let cid = conversationId;
      if (!cid) {
        if (!datasetId) throw new Error("Pick a dataset first");
        const r = await cc({ data: { datasetId, title: content.slice(0, 60) } });
        cid = r.id;
        setConversationId(cid);
      }
      await sm({ data: { conversationId: cid!, content } });
      return cid;
    },
    onSuccess: (cid) => {
      qc.invalidateQueries({ queryKey: ["conversation", cid] });
      qc.invalidateQueries({ queryKey: ["conversations", datasetId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const submit = () => {
    if (!input.trim()) return;
    sendMut.mutate(input.trim());
    setInput("");
  };

  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [convo.data?.messages.length]);

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <aside className="hidden lg:flex w-72 border-r border-glass-border flex-col">
        <div className="p-4 border-b border-glass-border space-y-3">
          <Select value={datasetId} onValueChange={(v) => { setDatasetId(v); setConversationId(undefined); }}>
            <SelectTrigger><SelectValue placeholder="Choose dataset" /></SelectTrigger>
            <SelectContent>
              {datasets.data?.datasets.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" className="w-full" onClick={() => setConversationId(undefined)}>
            <Plus className="mr-1 h-4 w-4" /> New chat
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.data?.conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => setConversationId(c.id)}
              className={`w-full text-left rounded-lg px-3 py-2 text-sm hover:bg-white/[0.04] transition ${conversationId === c.id ? "bg-white/[0.06] border border-glass-border" : ""}`}
            >
              <div className="flex items-center gap-2 truncate">
                <MessageSquare className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="truncate">{c.title}</span>
              </div>
            </button>
          ))}
        </div>
      </aside>

      <div className="flex flex-1 flex-col min-w-0">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {!convo.data?.messages.length && (
            <div className="flex h-full items-center justify-center text-center">
              <div className="max-w-md">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent-violet shadow-glow">
                  <Sparkles className="h-6 w-6 text-primary-foreground" />
                </div>
                <h2 className="mt-4 font-display text-xl font-semibold">Ask anything about your data</h2>
                <p className="mt-2 text-sm text-muted-foreground">"What were our top 5 products last quarter?" · "Show monthly revenue trend" · "Find anomalies in churn"</p>
              </div>
            </div>
          )}
          {convo.data?.messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <Card className={`glass border-glass-border p-4 max-w-2xl ${m.role === "user" ? "bg-primary/10" : ""}`}>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{m.role}</div>
                <div className="text-sm whitespace-pre-wrap">{m.content}</div>
                {m.chart_spec && typeof m.chart_spec === "object" && (
                  <div className="mt-4">
                    <AutoChart spec={m.chart_spec as unknown as ChartSpec} />
                  </div>
                )}
              </Card>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-glass-border bg-background/60 backdrop-blur-xl p-4">
          <div className="mx-auto max-w-3xl">
            <div className="glass border-glass-border rounded-2xl border p-2 flex items-end gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
                placeholder="Ask about trends, anomalies, segments…"
                className="min-h-[44px] border-0 bg-transparent focus-visible:ring-0 resize-none"
                rows={1}
              />
              <Button onClick={submit} disabled={sendMut.isPending || !datasetId}
                className="bg-gradient-to-r from-primary to-accent-violet text-primary-foreground shadow-glow">
                {sendMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <p className="mt-2 text-center text-[10px] text-muted-foreground">AI responses depend on your FastAPI backend deployment.</p>
          </div>
        </div>
      </div>
    </div>
  );
}