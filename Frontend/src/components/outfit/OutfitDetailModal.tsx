import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { OutfitPieceView } from "./OutfitPieceView";
import { OutfitExplanation } from "./OutfitExplanation";
import { OutfitFeedbackButtons } from "./OutfitFeedbackButtons";
import { formatContext } from "@/lib/utils/outfitUtils";
import type { Outfit, FeedbackType } from "@/types/outfit";

interface OutfitDetailModalProps {
  outfit: Outfit | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFeedback?: (feedbackType: FeedbackType) => void;
  onSwap?: () => void;
}

export const OutfitDetailModal = ({
  outfit,
  open,
  onOpenChange,
  onFeedback,
  onSwap,
}: OutfitDetailModalProps) => {
  if (!outfit) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Outfit Details</DialogTitle>
          <DialogDescription>{formatContext(outfit.context)}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Outfit Pieces</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {outfit.pieces.map((piece) => (
                <OutfitPieceView key={piece.id} piece={piece} size="lg" />
              ))}
            </div>
          </div>

          {outfit.explanation && (
            <OutfitExplanation explanation={outfit.explanation} />
          )}

          {(onFeedback || onSwap) && (
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-4">Your Feedback</h3>
              <OutfitFeedbackButtons
                outfitId={outfit.id}
                currentFeedback={outfit.feedback}
                onFeedback={onFeedback || (() => {})}
                onSwap={onSwap}
              />
            </div>
          )}

          {outfit.swapSuggestions && outfit.swapSuggestions.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Swap Suggestions</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {outfit.swapSuggestions.map((suggestion) => (
                  <OutfitPieceView key={suggestion.id} piece={suggestion} size="md" />
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

