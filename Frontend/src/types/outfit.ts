export type OutfitContext = {
  weather?: string;
  event?: string;
  location?: string;
  mood?: string;
  temperature?: number;
  occasion?: string;
  dressCode?: string;
};

export type FeedbackType = "like" | "dislike" | "swap";

export interface OutfitPiece {
  id: string;
  wardrobeItemId: string;
  imageUrl: string;
  name: string;
  category: string;
  position: "top" | "bottom" | "footwear" | "accessory" | "outerwear";
}

export interface Outfit {
  id: string;
  userId: string;
  pieces: OutfitPiece[];
  explanation: string; // RAG-generated explanation
  context: OutfitContext;
  createdAt: string;
  isFavorite: boolean;
  feedback?: FeedbackType;
  swapSuggestions?: OutfitPiece[]; // Alternative pieces for swap
  rating?: number; // User rating 1-5
}

export interface OutfitGenerationRequest {
  context: OutfitContext;
  excludeItems?: string[]; // Item IDs to exclude
  preferredItems?: string[]; // Item IDs to prefer
  stylePreferences?: string[];
}

export interface OutfitGenerationResponse {
  outfit: Outfit;
  alternatives?: Outfit[]; // Alternative outfit suggestions
}

export interface OutfitFeedback {
  outfitId: string;
  feedbackType: FeedbackType;
  swappedItemId?: string; // If feedback is "swap"
  newItemId?: string; // Item to replace with
  notes?: string;
}

export interface SavedOutfit extends Outfit {
  savedAt: string;
  tags?: string[];
}

export interface OutfitLookbook {
  outfits: SavedOutfit[];
  total: number;
  filters?: {
    dateRange?: { start: string; end: string };
    tags?: string[];
    favoritesOnly?: boolean;
  };
}

