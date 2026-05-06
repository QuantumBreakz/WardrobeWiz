import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
  className?: string;
  disabled?: boolean;
}

export const ImageUploadZone = ({
  onFilesSelected,
  maxFiles = 20,
  acceptedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  className,
  disabled = false,
}: ImageUploadZoneProps) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFilesSelected(acceptedFiles.slice(0, maxFiles));
      }
    },
    [onFilesSelected, maxFiles]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      "image/*": acceptedTypes.map((type) => type.replace("image/", "")),
    },
    maxFiles,
    disabled,
    multiple: true,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg transition-colors cursor-pointer",
        isDragActive && !isDragReject && "border-primary bg-primary/5",
        isDragReject && "border-destructive bg-destructive/5",
        !isDragActive && "border-foreground/20 hover:border-primary/50 hover:bg-muted/50",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <input {...getInputProps()} disabled={disabled} />
      <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
        {isDragActive ? (
          <>
            <Upload className="h-12 w-12 text-primary animate-bounce" />
            <p className="text-lg font-medium text-primary">Drop images here</p>
          </>
        ) : (
          <>
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted">
              <ImageIcon className="h-8 w-8 text-foreground/50" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">
                Drag and drop images here, or click to select
              </p>
              <p className="text-xs text-foreground/50">
                Supports JPEG, PNG, WebP (max {maxFiles} files)
              </p>
            </div>
          </>
        )}
        {isDragReject && (
          <p className="text-sm text-destructive">Some files were rejected</p>
        )}
      </div>
    </div>
  );
};

