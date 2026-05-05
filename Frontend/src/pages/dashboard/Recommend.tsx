import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Loader2 } from "lucide-react";
import { ContextInputForm } from "@/components/outfit/ContextInputForm";
import { OutfitCard } from "@/components/outfit/OutfitCard";
import { OutfitFeedbackButtons } from "@/components/outfit/OutfitFeedbackButtons";
import { useOutfitGeneration } from "@/hooks/useOutfitGeneration";
import { useFeedback } from "@/hooks/useFeedback";
import type { OutfitContext, FeedbackType } from "@/types/outfit";
import { toast } from "sonner";

const Recommend = () => {
  const [context, setContext] = useState<OutfitContext>({
    event: "",
    location: "",
    weather: "",
    mood: "",
  });

  const { generateOutfit, generatedOutfit, isGenerating } = useOutfitGeneration();
  const { submitFeedback } = useFeedback();

  const handleGenerate = () => {
    if (!context.event && !context.location && !context.weather) {
      toast.error("Please provide at least event, location, or weather information");
      return;
    }

    generateOutfit({
      context,
    });
  };

  const handleFeedback = (feedbackType: FeedbackType) => {
    if (generatedOutfit?.outfit) {
      submitFeedback({
        outfitId: generatedOutfit.outfit.id,
        feedbackType,
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="pb-8 border-b border-white/10">
        <p className="font-mono text-xs uppercase tracking-[0.4em] mb-4 text-white/40">AI Engine</p>
        <h1 className="text-5xl font-medium tracking-tight">Synthesize.</h1>
      </div>

      <ContextInputForm context={context} onChange={setContext} />

      <Card>
        <CardHeader>
          <CardTitle>What wardrobewiz Considers</CardTitle>
          <CardDescription>
            Our AI takes into account multiple factors when generating recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-white/50">
            <li>• Your wardrobe items and their usage history</li>
            <li>• Weather conditions and temperature</li>
            <li>• Event type and dress code requirements</li>
            <li>• Your style preferences and color palette</li>
            <li>• Last time each garment was worn (to encourage rotation)</li>
          </ul>
        </CardContent>
      </Card>

      <div className="flex justify-start border-t border-white/10 pt-8 mt-8">
        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          size="lg"
          variant="default"
        >
          {isGenerating ? "SYNTHESIZING..." : "SYNTHESIZE"}
        </Button>
      </div>

      {generatedOutfit?.outfit && (
        <div className="space-y-4">
          <OutfitCard outfit={generatedOutfit.outfit} showExplanation />
          <OutfitFeedbackButtons
            outfitId={generatedOutfit.outfit.id}
            onFeedback={handleFeedback}
          />
        </div>
      )}

      {generatedOutfit?.alternatives && generatedOutfit.alternatives.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Alternative Suggestions</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {generatedOutfit.alternatives.map((alt) => (
              <OutfitCard key={alt.id} outfit={alt} showExplanation={false} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Recommend;

