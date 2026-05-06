import { WardrobeItemCard } from "./WardrobeItemCard";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { WardrobeItem } from "@/types/wardrobe";

interface WardrobeGridProps {
  items: WardrobeItem[];
  isLoading?: boolean;
  onEdit?: (item: WardrobeItem) => void;
  onDelete?: (id: string) => void;
  onMarkWorn?: (id: string) => void;
  className?: string;
}

export const WardrobeGrid = ({
  items,
  isLoading = false,
  onEdit,
  onDelete,
  onMarkWorn,
  className,
}: WardrobeGridProps) => {
  if (isLoading) {
    return (
      <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4", className)}>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="aspect-square w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
        <p className="text-foreground/50 text-lg mb-2">No items found</p>
        <p className="text-foreground/50 text-sm">
          Try adjusting your filters or upload new items
        </p>
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4", className)}>
      {items.map((item) => (
        <WardrobeItemCard
          key={item.id}
          item={item}
          onEdit={onEdit}
          onDelete={onDelete}
          onMarkWorn={onMarkWorn}
        />
      ))}
    </div>
  );
};

