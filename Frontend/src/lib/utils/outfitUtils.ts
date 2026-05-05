import type { Outfit, OutfitPiece, OutfitContext } from "@/types/outfit";

/**
 * Format outfit explanation text
 */
export const formatOutfitExplanation = (explanation: string): string => {
  // Add basic formatting if needed
  return explanation.trim();
};

/**
 * Get outfit pieces by category
 */
export const getPiecesByCategory = (outfit: Outfit): Record<string, OutfitPiece[]> => {
  const grouped: Record<string, OutfitPiece[]> = {};

  outfit.pieces.forEach((piece) => {
    if (!grouped[piece.category]) {
      grouped[piece.category] = [];
    }
    grouped[piece.category].push(piece);
  });

  return grouped;
};

/**
 * Format context for display
 */
export const formatContext = (context: OutfitContext): string => {
  const parts: string[] = [];

  if (context.event) parts.push(context.event);
  if (context.location) parts.push(`in ${context.location}`);
  if (context.weather) parts.push(`(${context.weather})`);
  if (context.mood) parts.push(`- ${context.mood} mood`);

  return parts.join(" ") || "General occasion";
};

/**
 * Check if outfit is complete (has top, bottom, footwear)
 */
export const isOutfitComplete = (outfit: Outfit): boolean => {
  const hasTop = outfit.pieces.some((p) => p.position === "top");
  const hasBottom = outfit.pieces.some((p) => p.position === "bottom");
  const hasFootwear = outfit.pieces.some((p) => p.position === "footwear");

  return hasTop && hasBottom && hasFootwear;
};

/**
 * Get primary color from outfit pieces
 */
export const getOutfitColorScheme = (outfit: Outfit): string[] => {
  // This would typically come from the wardrobe items' color metadata
  // For now, return empty array
  return [];
};

