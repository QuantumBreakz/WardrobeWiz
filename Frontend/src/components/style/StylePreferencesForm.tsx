import { useState } from "react";
import { HexColorPicker } from "react-colorful";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import type { StylePreferences, ColorPalette, StyleAesthetic, FitPreference } from "@/types/style";

interface StylePreferencesFormProps {
  preferences: StylePreferences;
  onChange: (preferences: StylePreferences) => void;
  className?: string;
}

const aesthetics: StyleAesthetic[] = [
  "Minimalist",
  "Classic",
  "Casual",
  "Formal",
  "Bohemian",
  "Streetwear",
  "Vintage",
  "Modern",
  "Eclectic",
];

const fitOptions: FitPreference[] = ["Slim", "Regular", "Loose", "Oversized"];

export const StylePreferencesForm = ({
  preferences,
  onChange,
  className,
}: StylePreferencesFormProps) => {
  const [colorPickerOpen, setColorPickerOpen] = useState<string | null>(null);

  const handleColorAdd = (palette: "primary" | "secondary" | "accent", color: string) => {
    const newPalette = { ...preferences.colors };
    if (!newPalette[palette].includes(color)) {
      newPalette[palette] = [...newPalette[palette], color];
      onChange({ ...preferences, colors: newPalette });
    }
  };

  const handleColorRemove = (palette: "primary" | "secondary" | "accent", index: number) => {
    const newPalette = { ...preferences.colors };
    newPalette[palette] = newPalette[palette].filter((_, i) => i !== index);
    onChange({ ...preferences, colors: newPalette });
  };

  const handleAestheticToggle = (aesthetic: StyleAesthetic) => {
    const newAesthetics = preferences.aesthetics.includes(aesthetic)
      ? preferences.aesthetics.filter((a) => a !== aesthetic)
      : [...preferences.aesthetics, aesthetic];
    onChange({ ...preferences, aesthetics: newAesthetics });
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Style Preferences</CardTitle>
        <CardDescription>
          Define your personal style to help wardrobewiz make better recommendations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Label>Color Palette</Label>
          <div className="space-y-3">
            {(["primary", "secondary", "accent"] as const).map((palette) => (
              <div key={palette} className="space-y-2">
                <Label className="capitalize">{palette} Colors</Label>
                <div className="flex flex-wrap gap-2">
                  {preferences.colors[palette].map((color, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      {color}
                      <button
                        onClick={() => handleColorRemove(palette, index)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  <Popover
                    open={colorPickerOpen === palette}
                    onOpenChange={(open) => setColorPickerOpen(open ? palette : null)}
                  >
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm">
                        + Add {palette} color
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-3">
                      <HexColorPicker
                        color="#000000"
                        onChange={(color) => {
                          handleColorAdd(palette, color);
                          setColorPickerOpen(null);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Style Aesthetics</Label>
          <div className="flex flex-wrap gap-2">
            {aesthetics.map((aesthetic) => (
              <Badge
                key={aesthetic}
                variant={preferences.aesthetics.includes(aesthetic) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => handleAestheticToggle(aesthetic)}
              >
                {aesthetic}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Fit Preference</Label>
          <div className="flex gap-2">
            {fitOptions.map((fit) => (
              <Button
                key={fit}
                variant={preferences.fit === fit ? "default" : "outline"}
                size="sm"
                onClick={() => onChange({ ...preferences, fit })}
              >
                {fit}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

