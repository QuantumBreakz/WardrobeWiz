import { useState } from "react";
import { HexColorPicker } from "react-colorful";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  GarmentCategory,
  GarmentType,
  Season,
  WardrobeItemMetadata,
} from "@/types/wardrobe";

interface MetadataFormProps {
  metadata: WardrobeItemMetadata;
  onChange: (metadata: WardrobeItemMetadata) => void;
  showColorPicker?: boolean;
  className?: string;
}

const categories: GarmentCategory[] = [
  "Tops",
  "Bottoms",
  "Footwear",
  "Accessories",
  "Outerwear",
  "Dresses",
  "Other",
];

const types: Record<GarmentCategory, GarmentType[]> = {
  Tops: ["Shirt", "T-Shirt", "Sweater", "Other"],
  Bottoms: ["Pants", "Jeans", "Shorts", "Other"],
  Footwear: ["Shoes", "Boots", "Sneakers", "Other"],
  Accessories: ["Hat", "Bag", "Jewelry", "Other"],
  Outerwear: ["Jacket", "Coat", "Other"],
  Dresses: ["Dress", "Other"],
  Other: ["Other"],
};

const seasons: Season[] = ["Spring", "Summer", "Fall", "Winter", "All-Season"];

export const MetadataForm = ({
  metadata,
  onChange,
  showColorPicker = true,
  className,
}: MetadataFormProps) => {
  const [showColorPopover, setShowColorPopover] = useState(false);

  const handleChange = (field: keyof WardrobeItemMetadata, value: string | string[]) => {
    onChange({
      ...metadata,
      [field]: value,
      // Reset type when category changes
      ...(field === "category" && { type: types[value as GarmentCategory]?.[0] || "Other" }),
    });
  };

  const availableTypes = types[metadata.category] || types.Other;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Item Metadata</CardTitle>
        <CardDescription>Add details about this garment</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            placeholder="e.g., Blue Denim Jacket"
            value={metadata.name || ""}
            onChange={(e) => handleChange("name", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={metadata.category}
              onValueChange={(value) => handleChange("category", value)}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select
              value={metadata.type}
              onValueChange={(value) => handleChange("type", value)}
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {availableTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {showColorPicker && (
            <div className="space-y-2">
              <Label>Color</Label>
              <Popover open={showColorPopover} onOpenChange={setShowColorPopover}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    style={{ backgroundColor: metadata.color }}
                  >
                    <div
                      className="w-4 h-4 rounded-full mr-2 border border-white/20"
                      style={{ backgroundColor: metadata.color }}
                    />
                    {metadata.color || "Select color"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3">
                  <HexColorPicker
                    color={metadata.color || "#000000"}
                    onChange={(color) => handleChange("color", color)}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="season">Season</Label>
            <Select
              value={metadata.season}
              onValueChange={(value) => handleChange("season", value)}
            >
              <SelectTrigger id="season">
                <SelectValue placeholder="Select season" />
              </SelectTrigger>
              <SelectContent>
                {seasons.map((season) => (
                  <SelectItem key={season} value={season}>
                    {season}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea
            id="notes"
            placeholder="e.g., Perfect for casual Fridays, goes well with jeans..."
            value={metadata.notes || ""}
            onChange={(e) => handleChange("notes", e.target.value)}
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
};

