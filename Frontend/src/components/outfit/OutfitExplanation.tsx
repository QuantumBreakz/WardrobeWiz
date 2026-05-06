import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { formatOutfitExplanation } from "@/lib/utils/outfitUtils";

interface OutfitExplanationProps {
  explanation: string;
  className?: string;
}

export const OutfitExplanation = ({
  explanation,
  className,
}: OutfitExplanationProps) => {
  const formattedExplanation = formatOutfitExplanation(explanation);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Why This Outfit Works
        </CardTitle>
        <CardDescription>
          AI-generated explanation based on your wardrobe and context
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
          {formattedExplanation}
        </p>
      </CardContent>
    </Card>
  );
};

