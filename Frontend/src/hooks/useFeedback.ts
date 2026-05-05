import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { feedbackApi } from "@/lib/api/feedback";
import type { OutfitFeedback } from "@/types/outfit";
import { toast } from "sonner";

export const useFeedback = () => {
  const queryClient = useQueryClient();

  // Submit feedback mutation
  const submitMutation = useMutation({
    mutationFn: (feedback: OutfitFeedback) => feedbackApi.submitFeedback(feedback),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outfits"] });
      queryClient.invalidateQueries({ queryKey: ["feedback"] });
      toast.success("Feedback submitted");
    },
    onError: (error) => {
      toast.error("Failed to submit feedback");
      console.error(error);
    },
  });

  // Get feedback history
  const { data: feedbackHistory = [], isLoading } = useQuery({
    queryKey: ["feedback", "history"],
    queryFn: () => feedbackApi.getFeedbackHistory(50),
  });

  // Update feedback mutation
  const updateMutation = useMutation({
    mutationFn: ({ outfitId, feedback }: { outfitId: string; feedback: Partial<OutfitFeedback> }) =>
      feedbackApi.updateFeedback(outfitId, feedback),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback"] });
      toast.success("Feedback updated");
    },
    onError: (error) => {
      toast.error("Failed to update feedback");
      console.error(error);
    },
  });

  return {
    submitFeedback: submitMutation.mutate,
    updateFeedback: updateMutation.mutate,
    isSubmitting: submitMutation.isPending,
    isUpdating: updateMutation.isPending,
    feedbackHistory,
    isLoading,
  };
};

