import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FeedbackType } from "@/types/outfit";

interface OutfitFeedbackButtonsProps {
  outfitId: string;
  currentFeedback?: FeedbackType;
  onFeedback: (feedbackType: FeedbackType) => void;
  onSwap?: () => void;
  className?: string;
}

export const OutfitFeedbackButtons = ({
  outfitId,
  currentFeedback,
  onFeedback,
  onSwap,
  className,
}: OutfitFeedbackButtonsProps) => {
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackType | undefined>(currentFeedback);

  const handleFeedback = (feedbackType: FeedbackType) => {
    setSelectedFeedback(feedbackType);
    onFeedback(feedbackType);
  };

  return (
    <div className={cn("flex gap-2 flex-wrap", className)}>
      <Button
        variant={selectedFeedback === "like" ? "default" : "outline"}
        size="sm"
        onClick={() => handleFeedback("like")}
      >
        <ThumbsUp className="h-4 w-4 mr-2" />
        Like
      </Button>
      <Button
        variant={selectedFeedback === "dislike" ? "destructive" : "outline"}
        size="sm"
        onClick={() => handleFeedback("dislike")}
      >
        <ThumbsDown className="h-4 w-4 mr-2" />
        Dislike
      </Button>
      {onSwap && (
        <Button
          variant="outline"
          size="sm"
          onClick={onSwap}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Swap Item
        </Button>
      )}
    </div>
  );
};

