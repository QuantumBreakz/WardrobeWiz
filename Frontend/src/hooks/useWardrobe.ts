import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { wardrobeApi } from "@/lib/api/wardrobe";
import type { WardrobeItem, WardrobeFilters, WardrobeStats, WardrobeItemMetadata } from "@/types/wardrobe";
import { toast } from "sonner";

export const useWardrobe = (filters?: WardrobeFilters) => {
  const queryClient = useQueryClient();

  // Get wardrobe items
  const {
    data: items = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["wardrobe", filters],
    queryFn: () => wardrobeApi.getWardrobe(filters),
  });

  // Get wardrobe stats
  const { data: stats } = useQuery({
    queryKey: ["wardrobe", "stats"],
    queryFn: () => wardrobeApi.getWardrobeStats(),
  });

  // Create item mutation
  const createMutation = useMutation({
    mutationFn: wardrobeApi.createWardrobeItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wardrobe"] });
      toast.success("Item added to wardrobe");
    },
    onError: (error) => {
      toast.error("Failed to add item");
      console.error(error);
    },
  });

  // Update item mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<WardrobeItemMetadata> }) =>
      wardrobeApi.updateWardrobeItem(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wardrobe"] });
      toast.success("Item updated");
    },
    onError: (error) => {
      toast.error("Failed to update item");
      console.error(error);
    },
  });

  // Delete item mutation
  const deleteMutation = useMutation({
    mutationFn: wardrobeApi.deleteWardrobeItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wardrobe"] });
      toast.success("Item deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete item");
      console.error(error);
    },
  });

  // Mark item as worn
  const markWornMutation = useMutation({
    mutationFn: wardrobeApi.markItemWorn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wardrobe"] });
      queryClient.invalidateQueries({ queryKey: ["wardrobe", "stats"] });
    },
    onError: (error) => {
      toast.error("Failed to mark item as worn");
      console.error(error);
    },
  });

  return {
    items,
    stats,
    isLoading,
    error,
    refetch,
    createItem: createMutation.mutate,
    updateItem: updateMutation.mutate,
    deleteItem: deleteMutation.mutate,
    markWorn: markWornMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};

