import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { outfitApi } from "@/lib/api/outfit";
import type {
  OutfitGenerationRequest,
  OutfitGenerationResponse,
  Outfit,
  SavedOutfit,
  OutfitLookbook,
} from "@/types/outfit";
import { toast } from "sonner";

export const useOutfitGeneration = () => {
  const queryClient = useQueryClient();

  // Generate outfit mutation
  const generateMutation = useMutation({
    mutationFn: (request: OutfitGenerationRequest) => outfitApi.generateOutfit(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outfits"] });
    },
    onError: (error) => {
      toast.error("Failed to generate outfit");
      console.error(error);
    },
  });

  // Get saved outfits
  const { data: savedOutfits, isLoading: isLoadingSaved } = useQuery({
    queryKey: ["outfits", "saved"],
    queryFn: () => outfitApi.getSavedOutfits(),
  });

  // Save outfit mutation
  const saveMutation = useMutation({
    mutationFn: (id: string) => outfitApi.saveOutfit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outfits", "saved"] });
      toast.success("Outfit saved to favorites");
    },
    onError: (error) => {
      toast.error("Failed to save outfit");
      console.error(error);
    },
  });

  // Unsave outfit mutation
  const unsaveMutation = useMutation({
    mutationFn: (id: string) => outfitApi.unsaveOutfit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outfits", "saved"] });
      toast.success("Outfit removed from favorites");
    },
    onError: (error) => {
      toast.error("Failed to unsave outfit");
      console.error(error);
    },
  });

  return {
    generateOutfit: generateMutation.mutate,
    generatedOutfit: generateMutation.data,
    isGenerating: generateMutation.isPending,
    generateError: generateMutation.error,
    savedOutfits: savedOutfits?.outfits || [],
    isLoadingSaved,
    saveOutfit: saveMutation.mutate,
    unsaveOutfit: unsaveMutation.mutate,
    isSaving: saveMutation.isPending,
  };
};

