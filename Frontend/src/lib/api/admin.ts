import apiClient from "./client";

export interface AdminMetrics {
  total_users: number;
  total_items: number;
  total_outfits: number;
  total_feedback: number;
  server_uptime_seconds: number;
  ml_pipeline: {
    loaded: boolean;
    device: string;
    model_name: string;
    has_torch: boolean;
  };
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  is_admin: boolean;
  oauth_provider: string | null;
  created_at: number;
  item_count: number;
  outfit_count: number;
}

export const getAdminMetrics = async (): Promise<AdminMetrics> => {
  const res = await apiClient.get("/admin/metrics");
  return res.data;
};

export const getAdminUsers = async (): Promise<AdminUser[]> => {
  const res = await apiClient.get("/admin/users");
  return res.data;
};

export const patchAdminUser = async (
  userId: string,
  update: { is_admin?: boolean; name?: string }
): Promise<AdminUser> => {
  const res = await apiClient.patch(`/admin/users/${userId}`, update);
  return res.data;
};

export const deleteAdminUser = async (userId: string): Promise<void> => {
  await apiClient.delete(`/admin/users/${userId}`);
};

export const reloadMlModel = async (): Promise<{ status: string; pipeline: AdminMetrics["ml_pipeline"] }> => {
  const res = await apiClient.post("/admin/ml/reload");
  return res.data;
};
