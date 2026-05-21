import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { fastapi, isFastApiConfigured } from "./fastapi.server";

export const listConversations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { datasetId?: string }) =>
    z.object({ datasetId: z.string().uuid().optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("conversations")
      .select("id,title,dataset_id,updated_at")
      .order("updated_at", { ascending: false });
    if (data.datasetId) q = q.eq("dataset_id", data.datasetId);
    const { data: conv, error } = await q;
    if (error) throw new Error(error.message);
    return { conversations: conv ?? [] };
  });

export const getConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: conv } = await context.supabase
      .from("conversations")
      .select("*")
      .eq("id", data.id)
      .single();
    const { data: msgs } = await context.supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", data.id)
      .order("created_at");
    return { conversation: conv, messages: msgs ?? [] };
  });

export const createConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { datasetId: string; title?: string }) =>
    z
      .object({
        datasetId: z.string().uuid(),
        title: z.string().max(120).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: conv, error } = await context.supabase
      .from("conversations")
      .insert({
        user_id: context.userId,
        dataset_id: data.datasetId,
        title: data.title ?? "New conversation",
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { id: conv.id };
  });

export const sendMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        conversationId: z.string().uuid(),
        content: z.string().min(1).max(4000),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: conv } = await supabase
      .from("conversations")
      .select("id,dataset_id")
      .eq("id", data.conversationId)
      .single();
    if (!conv) throw new Error("Conversation not found");

    // Insert user message
    await supabase.from("messages").insert({
      conversation_id: data.conversationId,
      user_id: userId,
      role: "user",
      content: data.content,
    });

    // Fetch history (last 20)
    const { data: history } = await supabase
      .from("messages")
      .select("role,content,chart_spec")
      .eq("conversation_id", data.conversationId)
      .order("created_at", { ascending: false })
      .limit(20);

    const { data: ds } = await supabase
      .from("datasets")
      .select("id,name,storage_path,schema")
      .eq("id", conv.dataset_id)
      .single();

    let assistantText = "AI service is not configured yet. Deploy your FastAPI backend and set FASTAPI_BASE_URL to enable natural-language querying.";
    let chartSpec: unknown = null;
    let toolCalls: unknown = [];

    if (isFastApiConfigured() && ds) {
      try {
        const resp = await fastapi<{
          content: string;
          chart_spec?: unknown;
          tool_calls?: unknown;
        }>({
          path: "/chat",
          body: {
            dataset_id: ds.id,
            storage_path: ds.storage_path,
            schema: ds.schema,
            messages: (history ?? []).reverse(),
          },
          userId,
          timeoutMs: 120_000,
        });
        assistantText = resp.content;
        chartSpec = resp.chart_spec ?? null;
        toolCalls = resp.tool_calls ?? [];
      } catch (err) {
        console.warn("FastAPI chat failed:", err);
        assistantText = "The AI service returned an error. Please check your FastAPI deployment logs.";
      }
    }

    const { data: assistantMsg, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: data.conversationId,
        user_id: userId,
        role: "assistant",
        content: assistantText,
        chart_spec: chartSpec,
        tool_calls: toolCalls,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", data.conversationId);

    return { message: assistantMsg };
  });