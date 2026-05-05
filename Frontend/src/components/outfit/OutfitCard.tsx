import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OutfitPieceView } from "./OutfitPieceView";
import { OutfitExplanation } from "./OutfitExplanation";
import { formatContext } from "@/lib/utils/outfitUtils";
import { cn } from "@/lib/utils";
import type { Outfit } from "@/types/outfit";

interface OutfitCardProps {
  outfit: Outfit;
  showExplanation?: boolean;
  className?: string;
  onSelect?: (outfit: Outfit) => void;
}

export const OutfitCard = ({
  outfit,
  showExplanation = true,
  className,
  onSelect,
}: OutfitCardProps) => {
  return (
    <Card
      className={cn("overflow-hidden hover:shadow-lg transition-shadow", className)}
      onClick={() => onSelect?.(outfit)}
    >
      <CardHeader>
        <CardTitle>Generated Outfit</CardTitle>
        <CardDescription>{formatContext(outfit.context)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {outfit.pieces.map((piece) => (
            <OutfitPieceView key={piece.id} piece={piece} size="md" />
          ))}
        </div>

        {showExplanation && outfit.explanation && (
          <OutfitExplanation explanation={outfit.explanation} />
        )}

        {outfit.isFavorite && (
          <div className="text-xs text-white/50">
            Saved to favorites
          </div>
        )}
      </CardContent>
    </Card>
  );
};

