import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Edit, Trash2, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { WardrobeItem } from "@/types/wardrobe";

interface WardrobeItemCardProps {
  item: WardrobeItem;
  onEdit?: (item: WardrobeItem) => void;
  onDelete?: (id: string) => void;
  onMarkWorn?: (id: string) => void;
  className?: string;
}

export const WardrobeItemCard = ({
  item,
  onEdit,
  onDelete,
  onMarkWorn,
  className,
}: WardrobeItemCardProps) => {
  const [imageError, setImageError] = useState(false);

  return (
    <Card className={cn("group overflow-hidden border border-black/20/60 hover:shadow-lg transition-shadow", className)}>
      <div className="aspect-square overflow-hidden relative bg-muted">
        {!imageError ? (
          <img
            src={item.thumbnailUrl || item.imageUrl}
            alt={item.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImageError(true)}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <p className="text-black/50 text-sm">Image not available</p>
          </div>
        )}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(item)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {onMarkWorn && (
                <DropdownMenuItem onClick={() => onMarkWorn(item.id)}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Mark as worn
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(item.id)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="absolute bottom-2 left-2">
          <Badge variant="secondary" className="text-xs">
            {item.category}
          </Badge>
        </div>
      </div>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-black truncate flex-1">
            {item.name}
          </h3>
        </div>
        {item.notes && (
          <p className="text-xs text-black/50 line-clamp-2">{item.notes}</p>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          <div
            className="w-3 h-3 rounded-full border border-black/20"
            style={{ backgroundColor: item.color }}
            title={item.color}
          />
          <span className="text-xs text-black/50">{item.season}</span>
          {item.wearCount > 0 && (
            <span className="text-xs text-black/50">
              Worn {item.wearCount}x
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

