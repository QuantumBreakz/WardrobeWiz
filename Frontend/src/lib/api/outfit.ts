import apiClient from "./client";
import type {
  Outfit,
  OutfitGenerationRequest,
  OutfitGenerationResponse,
  OutfitFeedback,
  SavedOutfit,
  OutfitLookbook,
} from "@/types/outfit";

export const outfitApi = {
  // Generate outfit based on context
  generateOutfit: async (
    request: OutfitGenerationRequest
  ): Promise<OutfitGenerationResponse> => {
    const response = await apiClient.post("/outfit/generate", request);
    return response.data;
  },

  // Get saved outfits
  getSavedOutfits: async (filters?: {
    favoritesOnly?: boolean;
    tags?: string[];
    dateRange?: { start: string; end: string };
  }): Promise<OutfitLookbook> => {
    const response = await apiClient.get("/outfit/saved", { params: filters });
    return response.data;
  },

  // Get single outfit
  getOutfit: async (id: string): Promise<Outfit> => {
    const response = await apiClient.get(`/outfit/${id}`);
    return response.data;
  },

  // Save outfit to favorites
  saveOutfit: async (id: string): Promise<SavedOutfit> => {
    const response = await apiClient.post(`/outfit/${id}/save`);
    return response.data;
  },

  // Unsave outfit
  unsaveOutfit: async (id: string): Promise<void> => {
    await apiClient.delete(`/outfit/${id}/save`);
  },

  // Submit feedback
  submitFeedback: async (feedback: OutfitFeedback): Promise<void> => {
    await apiClient.post("/outfit/feedback", feedback);
  },

  // Get outfit alternatives
  getAlternatives: async (outfitId: string): Promise<Outfit[]> => {
    const response = await apiClient.get(`/outfit/${outfitId}/alternatives`);
    return response.data;
  },
};

