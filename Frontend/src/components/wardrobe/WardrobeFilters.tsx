import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { WardrobeFilters as WardrobeFiltersType, GarmentCategory, Season } from "@/types/wardrobe";

interface WardrobeFiltersProps {
  filters: WardrobeFiltersType;
  onFiltersChange: (filters: WardrobeFiltersType) => void;
  className?: string;
}

const categories: (GarmentCategory | "All")[] = [
  "All",
  "Tops",
  "Bottoms",
  "Footwear",
  "Accessories",
  "Outerwear",
  "Dresses",
  "Other",
];

const seasons: (Season | "All")[] = [
  "All",
  "Spring",
  "Summer",
  "Fall",
  "Winter",
  "All-Season",
];

export const WardrobeFilters = ({
  filters,
  onFiltersChange,
  className,
}: WardrobeFiltersProps) => {
  const handleFilterChange = (key: keyof WardrobeFiltersType, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value === "All" ? undefined : value,
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.keys(filters).some(
    (key) => filters[key as keyof WardrobeFiltersType] !== undefined
  );

  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search your wardrobe..."
              value={filters.searchQuery || ""}
              onChange={(e) => handleFilterChange("searchQuery", e.target.value)}
              className="w-full"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <Select
              value={filters.category || "All"}
              onValueChange={(value) => handleFilterChange("category", value)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.season || "All"}
              onValueChange={(value) => handleFilterChange("season", value)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Season" />
              </SelectTrigger>
              <SelectContent>
                {seasons.map((season) => (
                  <SelectItem key={season} value={season}>
                    {season}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mt-4">
            {filters.category && filters.category !== "All" && (
              <Badge variant="secondary">
                Category: {filters.category}
                <button
                  onClick={() => handleFilterChange("category", "All")}
                  className="ml-2 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.season && filters.season !== "All" && (
              <Badge variant="secondary">
                Season: {filters.season}
                <button
                  onClick={() => handleFilterChange("season", "All")}
                  className="ml-2 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.searchQuery && (
              <Badge variant="secondary">
                Search: {filters.searchQuery}
                <button
                  onClick={() => handleFilterChange("searchQuery", "")}
                  className="ml-2 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

