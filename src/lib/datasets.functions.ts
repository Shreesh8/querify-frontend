import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listDatasets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("datasets")
      .select("id,name,source_filename,row_count,col_count,status,created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { datasets: data ?? [] };
  });

export const getDataset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: ds, error } = await context.supabase
      .from("datasets")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    const { data: cols } = await context.supabase
      .from("dataset_columns")
      .select("*")
      .eq("dataset_id", data.id)
      .order("position");
    return { dataset: ds, columns: cols ?? [] };
  });

const ColumnSchema = z.object({
  name: z.string().min(1),
  dtype: z.enum(["number", "string", "boolean", "date", "unknown"]),
  null_pct: z.number().nullable().optional(),
  unique_count: z.number().nullable().optional(),
  stats: z.record(z.string(), z.any()).optional(),
});

export const createDataset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        name: z.string().min(1).max(120),
        source_filename: z.string().max(255).optional(),
        storage_path: z.string().max(500).optional(),
        row_count: z.number().int().min(0),
        col_count: z.number().int().min(0),
        columns: z.array(ColumnSchema).min(1).max(500),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    const { data: ds, error } = await supabase
      .from("datasets")
      .insert({
        user_id: userId,
        name: data.name,
        source_filename: data.source_filename,
        storage_path: data.storage_path,
        row_count: data.row_count,
        col_count: data.col_count,
        schema: { columns: data.columns.map((c) => ({ name: c.name, dtype: c.dtype })) },
        status: "ready",
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    const rows = data.columns.map((c, i) => ({
      dataset_id: ds.id,
      user_id: userId,
      name: c.name,
      dtype: c.dtype,
      null_pct: c.null_pct ?? null,
      unique_count: c.unique_count ?? null,
      stats: c.stats ?? {},
      position: i,
    }));
    const { error: colErr } = await supabase.from("dataset_columns").insert(rows);
    if (colErr) throw new Error(colErr.message);

    return { id: ds.id };
  });

export const deleteDataset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("datasets").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });