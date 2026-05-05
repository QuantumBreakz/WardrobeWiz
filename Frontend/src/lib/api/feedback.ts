import apiClient from "./client";
import type { OutfitFeedback } from "@/types/outfit";

export const feedbackApi = {
  // Submit outfit feedback
  submitFeedback: async (feedback: OutfitFeedback): Promise<void> => {
    await apiClient.post("/feedback", feedback);
  },

  // Get feedback history
  getFeedbackHistory: async (limit?: number): Promise<OutfitFeedback[]> => {
    const response = await apiClient.get("/feedback/history", {
      params: { limit },
    });
    return response.data;
  },

  // Update feedback
  updateFeedback: async (
    outfitId: string,
    feedback: Partial<OutfitFeedback>
  ): Promise<void> => {
    await apiClient.patch(`/feedback/${outfitId}`, feedback);
  },
};

