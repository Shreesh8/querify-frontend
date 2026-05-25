import { api } from "@/lib/api";

export const listDashboards = async () => {
  try {
    return await api({ path: "/api/v1/dashboards/" });
  } catch {
    return [];
  }
};

export const getDashboard = async (id: string) => {
  return api({ path: `/api/v1/dashboards/${id}` });
};
