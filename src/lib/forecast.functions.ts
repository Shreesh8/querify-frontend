import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { fastapi, isFastApiConfigured } from "./fastapi.server";

export const runForecast = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        datasetId: z.string().uuid(),
        targetCol: z.string().min(1),
        timeCol: z.string().optional(),
        horizon: z.number().int().min(1).max(365).default(12),
        method: z.enum(["auto", "arima", "prophet", "linear"]).default("auto"),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: ds } = await supabase
      .from("datasets")
      .select("id,storage_path")
      .eq("id", data.datasetId)
      .single();

    let result: {
      history: Array<{ t: string | number; y: number }>;
      forecast: Array<{ t: string | number; yhat: number; lo?: number; hi?: number }>;
      method: string;
    } = { history: [], forecast: [], method: data.method };

    if (isFastApiConfigured() && ds?.storage_path) {
      try {
        result = await fastapi({
          path: "/forecast",
          body: {
            dataset_id: ds.id,
            storage_path: ds.storage_path,
            target_col: data.targetCol,
            time_col: data.timeCol,
            horizon: data.horizon,
            method: data.method,
          },
          userId,
        });
      } catch (err) {
        console.warn("FastAPI forecast failed:", err);
        return {
          result,
          error: "Forecast service unavailable. Deploy your FastAPI backend and set FASTAPI_BASE_URL.",
        };
      }
    } else {
      return {
        result,
        error: "Forecasting requires your FastAPI backend. Configure FASTAPI_BASE_URL to enable.",
      };
    }

    await supabase.from("forecasts").insert({
      dataset_id: data.datasetId,
      user_id: userId,
      target_col: data.targetCol,
      time_col: data.timeCol ?? null,
      horizon: data.horizon,
      method: data.method,
      result,
    });
    return { result, error: null };
  });