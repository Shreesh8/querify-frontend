import { analyticsApi, insightsApi } from "@/lib/api";

export const profileDataset = async (datasetId: string) => {
  return analyticsApi.get(datasetId);
};

export const generateInsights = async (datasetId: string) => {
  return insightsApi.get(datasetId);
};

export const listInsights = async (datasetId: string) => {
  return insightsApi.get(datasetId);
};
