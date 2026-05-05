import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { OutfitPiece } from "@/types/outfit";

interface OutfitPieceViewProps {
  piece: OutfitPiece;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const OutfitPieceView = ({
  piece,
  className,
  size = "md",
}: OutfitPieceViewProps) => {
  const sizeClasses = {
    sm: "h-24",
    md: "h-32",
    lg: "h-48",
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className={cn("relative overflow-hidden bg-muted", sizeClasses[size])}>
        <img
          src={piece.imageUrl}
          alt={piece.name}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
          <Badge variant="secondary" className="text-xs">
            {piece.category}
          </Badge>
        </div>
      </div>
      <CardContent className="p-3">
        <h4 className="font-semibold text-sm text-black truncate">
          {piece.name}
        </h4>
        <p className="text-xs text-black/50 capitalize mt-1">
          {piece.position}
        </p>
      </CardContent>
    </Card>
  );
};

