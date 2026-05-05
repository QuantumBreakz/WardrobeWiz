import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { UploadedImage } from "@/types/wardrobe";

interface ImagePreviewGridProps {
  images: UploadedImage[];
  onRemove: (id: string) => void;
  onEdit?: (id: string) => void;
  className?: string;
}

export const ImagePreviewGrid = ({
  images,
  onRemove,
  onEdit,
  className,
}: ImagePreviewGridProps) => {
  if (images.length === 0) {
    return null;
  }

  return (
    <div className={cn("grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4", className)}>
      {images.map((image) => (
        <div
          key={image.id}
          className="group relative aspect-square rounded-lg overflow-hidden border border-black/20 bg-muted"
        >
          <img
            src={image.preview}
            alt={image.metadata?.name || "Preview"}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7"
            onClick={() => onRemove(image.id)}
          >
            <X className="h-4 w-4" />
          </Button>
          {onEdit && (
            <Button
              variant="secondary"
              size="sm"
              className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onEdit(image.id)}
            >
              Edit Metadata
            </Button>
          )}
          {image.metadata?.name && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
              <p className="text-xs text-black font-medium truncate">
                {image.metadata.name}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

