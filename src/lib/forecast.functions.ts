import { forecastApi } from "@/lib/api";

export const runForecast = async (payload: {
  datasetId: string;
  targetCol: string;
  timeCol?: string;
  horizon?: number;
  frequency?: string;
}) => {
  return forecastApi.generate({
    dataset_id: payload.datasetId,
    date_column: payload.timeCol ?? "date",
    target_column: payload.targetCol,
    periods: payload.horizon ?? 30,
    frequency: payload.frequency ?? "D",
  });
};
