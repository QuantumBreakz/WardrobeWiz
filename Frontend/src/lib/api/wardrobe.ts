import apiClient from "./client";
import type { WardrobeItem, WardrobeFilters, WardrobeStats, WardrobeItemMetadata } from "@/types/wardrobe";

export const wardrobeApi = {
  // Get all wardrobe items
  getWardrobe: async (filters?: WardrobeFilters): Promise<WardrobeItem[]> => {
    const response = await apiClient.get("/wardrobe", { params: filters });
    return response.data;
  },

  // Get single wardrobe item
  getWardrobeItem: async (id: string): Promise<WardrobeItem> => {
    const response = await apiClient.get(`/wardrobe/${id}`);
    return response.data;
  },

  // Upload wardrobe items with images
  uploadWardrobeItems: async (
    formData: FormData
  ): Promise<{ items: WardrobeItem[]; errors?: string[] }> => {
    const response = await apiClient.post("/wardrobe/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Create wardrobe item
  createWardrobeItem: async (
    item: Omit<WardrobeItem, "id" | "userId" | "createdAt" | "updatedAt" | "wearCount">
  ): Promise<WardrobeItem> => {
    const response = await apiClient.post("/wardrobe", item);
    return response.data;
  },

  // Update wardrobe item
  updateWardrobeItem: async (
    id: string,
    updates: Partial<WardrobeItemMetadata>
  ): Promise<WardrobeItem> => {
    const response = await apiClient.patch(`/wardrobe/${id}`, updates);
    return response.data;
  },

  // Delete wardrobe item
  deleteWardrobeItem: async (id: string): Promise<void> => {
    await apiClient.delete(`/wardrobe/${id}`);
  },

  // Get wardrobe statistics
  getWardrobeStats: async (): Promise<WardrobeStats> => {
    const response = await apiClient.get("/wardrobe/stats");
    return response.data;
  },

  // Mark item as worn
  markItemWorn: async (id: string): Promise<WardrobeItem> => {
    const response = await apiClient.post(`/wardrobe/${id}/worn`);
    return response.data;
  },
};

