import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { OutfitContext } from "@/types/outfit";

interface ContextInputFormProps {
  context: OutfitContext;
  onChange: (context: OutfitContext) => void;
  className?: string;
}

export const ContextInputForm = ({
  context,
  onChange,
  className,
}: ContextInputFormProps) => {
  const handleChange = (field: keyof OutfitContext, value: string | number) => {
    onChange({
      ...context,
      [field]: value,
    });
  };

  return (
    <div className={className}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16">
        <div className="space-y-4">
          <Label htmlFor="event" className="font-mono text-xs uppercase tracking-widest text-black/40">Event / Occasion</Label>
          <Input
            id="event"
            placeholder="e.g., Board meeting"
            value={context.event || ""}
            onChange={(e) => handleChange("event", e.target.value)}
          />
        </div>

        <div className="space-y-4">
          <Label htmlFor="location" className="font-mono text-xs uppercase tracking-widest text-black/40">Location</Label>
          <Input
            id="location"
            placeholder="e.g., Karachi"
            value={context.location || ""}
            onChange={(e) => handleChange("location", e.target.value)}
          />
        </div>

        <div className="space-y-4">
          <Label htmlFor="weather" className="font-mono text-xs uppercase tracking-widest text-black/40">Weather</Label>
          <Input
            id="weather"
            placeholder="e.g., Humid"
            value={context.weather || ""}
            onChange={(e) => handleChange("weather", e.target.value)}
          />
        </div>

        <div className="space-y-4">
          <Label htmlFor="mood" className="font-mono text-xs uppercase tracking-widest text-black/40">Mood / Style</Label>
          <Input
            id="mood"
            placeholder="e.g., Professional"
            value={context.mood || ""}
            onChange={(e) => handleChange("mood", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};
