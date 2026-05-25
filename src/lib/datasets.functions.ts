import { datasetsApi, analyticsApi, insightsApi } from "@/lib/api";

export const listDatasets = async () => {
  return datasetsApi.list();
};

export const getDataset = async (id: string) => {
  return datasetsApi.get(id);
};

export const getDatasetPreview = async (id: string) => {
  return datasetsApi.preview(id);
};

export const deleteDataset = async (id: string) => {
  return datasetsApi.delete(id);
};

export const uploadDataset = async (file: File, name: string) => {
  return datasetsApi.upload(file, name);
};

export const createDataset = async (file: File, name: string) => {
  return datasetsApi.upload(file, name);
};
