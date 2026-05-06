import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Share2 } from "lucide-react";
import { OutfitCard } from "@/components/outfit/OutfitCard";
import { OutfitDetailModal } from "@/components/outfit/OutfitDetailModal";
import { useOutfitGeneration } from "@/hooks/useOutfitGeneration";
import { useFeedback } from "@/hooks/useFeedback";
import { Skeleton } from "@/components/ui/skeleton";
import type { Outfit, FeedbackType } from "@/types/outfit";

const Outfits = () => {
  const navigate = useNavigate();
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null);
  const { savedOutfits, isLoadingSaved, unsaveOutfit } = useOutfitGeneration();
  const { submitFeedback } = useFeedback();

  const handleOutfitClick = (outfit: Outfit) => {
    setSelectedOutfit(outfit);
  };

  const handleFeedback = (feedbackType: FeedbackType) => {
    if (selectedOutfit) {
      submitFeedback({
        outfitId: selectedOutfit.id,
        feedbackType,
      });
    }
  };

  const handleSwap = () => {
    // TODO: Implement swap functionality
    console.log("Swap item in outfit");
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Saved Outfits & Lookbook</h1>
          <p className="text-foreground/50 mt-2">
            Review what wardrobewiz has generated so far. Pin favorites, share with friends, or refine a look.
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => navigate("/dashboard/recommend")}>
            <Sparkles className="h-4 w-4 mr-2" />
            Generate New Look
          </Button>
          <Button variant="secondary">
            <Share2 className="h-4 w-4 mr-2" />
            Share Board
          </Button>
        </div>
      </div>

      {isLoadingSaved ? (
        <div className="grid gap-6 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-[4/3] w-full" />
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : savedOutfits.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-foreground/50 text-lg mb-2">No saved outfits yet</p>
            <p className="text-foreground/50 text-sm mb-4">
              Generate your first outfit recommendation to get started
            </p>
            <Button onClick={() => navigate("/dashboard/recommend")}>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Outfit
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {savedOutfits.map((outfit) => (
            <OutfitCard
              key={outfit.id}
              outfit={outfit}
              showExplanation={false}
              onSelect={handleOutfitClick}
            />
          ))}
        </div>
      )}

      <OutfitDetailModal
        outfit={selectedOutfit}
        open={!!selectedOutfit}
        onOpenChange={(open) => !open && setSelectedOutfit(null)}
        onFeedback={handleFeedback}
        onSwap={handleSwap}
      />
    </div>
  );
};

export default Outfits;

