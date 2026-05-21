import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listDashboards = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("dashboards")
      .select("id,name,dataset_id,updated_at")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { dashboards: data ?? [] };
  });

export const getDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: dash } = await context.supabase
      .from("dashboards")
      .select("*")
      .eq("id", data.id)
      .single();
    const { data: charts } = await context.supabase
      .from("charts")
      .select("*")
      .eq("dashboard_id", data.id)
      .order("created_at");
    return { dashboard: dash, charts: charts ?? [] };
  });

export const createDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { datasetId: string; name?: string }) =>
    z
      .object({
        datasetId: z.string().uuid(),
        name: z.string().max(120).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: dash, error } = await context.supabase
      .from("dashboards")
      .insert({
        user_id: context.userId,
        dataset_id: data.datasetId,
        name: data.name ?? "Untitled dashboard",
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { id: dash.id };
  });