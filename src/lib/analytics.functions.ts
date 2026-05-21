import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { fastapi, isFastApiConfigured } from "./fastapi.server";

/**
 * Ask FastAPI for a full profile of the dataset. Falls back to a stub
 * (using the cached column stats) when FASTAPI_BASE_URL is not configured,
 * so the UI is always functional.
 */
export const profileDataset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { datasetId: string }) =>
    z.object({ datasetId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: ds } = await supabase
      .from("datasets")
      .select("id,name,storage_path,row_count")
      .eq("id", data.datasetId)
      .single();
    const { data: cols } = await supabase
      .from("dataset_columns")
      .select("*")
      .eq("dataset_id", data.datasetId)
      .order("position");

    if (isFastApiConfigured() && ds?.storage_path) {
      try {
      const profile = await fastapi<{
          summary: Record<string, string | number>;
          correlations: Array<{ a: string; b: string; r: number }>;
          outliers: Array<{ column: string; count: number }>;
        }>({
          path: "/profile",
          body: { dataset_id: ds.id, storage_path: ds.storage_path },
          userId,
        });
        return { profile, columns: cols ?? [], source: "fastapi" as const };
      } catch (err) {
        console.warn("FastAPI profile failed, falling back:", err);
      }
    }

    return {
      profile: {
        summary: { rows: ds?.row_count ?? 0, columns: cols?.length ?? 0 } as Record<string, number>,
        correlations: [],
        outliers: [],
      },
      columns: cols ?? [],
      source: "fallback" as const,
    };
  });

export const generateInsights = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { datasetId: string }) =>
    z.object({ datasetId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: ds } = await supabase
      .from("datasets")
      .select("id,name,storage_path,schema,row_count,col_count")
      .eq("id", data.datasetId)
      .single();

    let insights: Array<{ type: string; title: string; body: string; severity: string }> = [];
    if (isFastApiConfigured() && ds?.storage_path) {
      try {
        const resp = await fastapi<{
          insights: typeof insights;
        }>({
          path: "/insights",
          body: { dataset_id: ds.id, storage_path: ds.storage_path, schema: ds.schema },
          userId,
        });
        insights = resp.insights;
      } catch (err) {
        console.warn("FastAPI insights failed:", err);
      }
    }

    if (insights.length === 0) {
      insights = [
        {
          type: "overview",
          title: "Dataset ready for analysis",
          body: `Loaded ${ds?.row_count ?? 0} rows. Configure your FastAPI service to unlock AI insights.`,
          severity: "info",
        },
      ];
    }

    const rows = insights.map((i) => ({
      dataset_id: data.datasetId,
      user_id: userId,
      type: i.type,
      title: i.title,
      body: i.body,
      severity: i.severity,
    }));
    await supabase.from("insights").delete().eq("dataset_id", data.datasetId);
    const { error } = await supabase.from("insights").insert(rows);
    if (error) throw new Error(error.message);
    return { insights };
  });

export const listInsights = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { datasetId: string }) =>
    z.object({ datasetId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: ins } = await context.supabase
      .from("insights")
      .select("*")
      .eq("dataset_id", data.datasetId)
      .order("created_at", { ascending: false });
    return { insights: ins ?? [] };
  });