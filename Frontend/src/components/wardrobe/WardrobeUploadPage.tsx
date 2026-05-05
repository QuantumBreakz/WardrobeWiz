import { useState, useCallback } from "react";
import { ImageUploadZone } from "./ImageUploadZone";
import { ImagePreviewGrid } from "./ImagePreviewGrid";
import { MetadataForm } from "./MetadataForm";
import { UploadProgress } from "./UploadProgress";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, CheckCircle2 } from "lucide-react";
import { createImagePreview, validateImageFile, compressImage } from "@/lib/utils/imageUtils";
import type { UploadedImage, WardrobeItemMetadata, GarmentCategory, GarmentType, Season } from "@/types/wardrobe";
import type { UploadStatus } from "./UploadProgress";

interface WardrobeUploadPageProps {
  onUploadComplete?: (items: any[]) => void;
  maxFiles?: number;
}

export const WardrobeUploadPage = ({
  onUploadComplete,
  maxFiles = 20,
}: WardrobeUploadPageProps) => {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadMessage, setUploadMessage] = useState<string>("");

  const handleFilesSelected = useCallback(async (files: File[]) => {
    const validFiles: File[] = [];
    const errors: string[] = [];

    // Validate files
    for (const file of files) {
      const validation = validateImageFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    }

    if (errors.length > 0) {
      console.warn("Some files were rejected:", errors);
    }

    // Create previews and metadata
    const newImages: UploadedImage[] = await Promise.all(
      validFiles.map(async (file) => {
        const preview = await createImagePreview(file);
        const id = `${Date.now()}-${Math.random()}`;
        return {
          id,
          file,
          preview,
          metadata: {
            category: "Tops" as GarmentCategory,
            type: "Shirt" as GarmentType,
            color: "#000000",
            season: "All-Season" as Season,
          },
        };
      })
    );

    setUploadedImages((prev) => [...prev, ...newImages].slice(0, maxFiles));
  }, [maxFiles]);

  const handleRemoveImage = useCallback((id: string) => {
    setUploadedImages((prev) => prev.filter((img) => img.id !== id));
    if (selectedImageId === id) {
      setSelectedImageId(null);
    }
  }, [selectedImageId]);

  const handleMetadataChange = useCallback((metadata: WardrobeItemMetadata) => {
    if (!selectedImageId) return;

    setUploadedImages((prev) =>
      prev.map((img) =>
        img.id === selectedImageId ? { ...img, metadata } : img
      )
    );
  }, [selectedImageId]);

  const handleUpload = useCallback(async () => {
    if (uploadedImages.length === 0) return;

    setUploadStatus("uploading");
    setUploadProgress(0);
    setUploadMessage("Compressing images...");

    try {
      // Compress images
      const compressedFiles = await Promise.all(
        uploadedImages.map((img) => compressImage(img.file))
      );

      setUploadMessage("Uploading to server...");

      // Create FormData
      const formData = new FormData();
      compressedFiles.forEach((file, index) => {
        formData.append("files", file);
        formData.append(
          `metadata_${index}`,
          JSON.stringify(uploadedImages[index].metadata)
        );
      });

      // Simulate upload progress (replace with actual API call)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // TODO: Replace with actual API call
      // const response = await uploadApi.uploadBatch(
      //   compressedFiles,
      //   uploadedImages.map((img) => img.metadata!),
      //   (progress) => setUploadProgress(progress.percentage)
      // );

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadStatus("success");
      setUploadMessage(`${uploadedImages.length} items uploaded successfully!`);

      // Call completion callback
      if (onUploadComplete) {
        // onUploadComplete(response.items);
        onUploadComplete([]);
      }

      // Clear uploaded images after success
      setTimeout(() => {
        setUploadedImages([]);
        setSelectedImageId(null);
        setUploadStatus("idle");
        setUploadProgress(0);
      }, 3000);
    } catch (error) {
      setUploadStatus("error");
      setUploadMessage("Upload failed. Please try again.");
      console.error("Upload error:", error);
    }
  }, [uploadedImages, onUploadComplete]);

  const selectedImage = uploadedImages.find((img) => img.id === selectedImageId);
  const canUpload = uploadedImages.length > 0 && uploadedImages.every((img) => img.metadata);

  return (
    <div className="space-y-6">
      <div className="pb-8 border-b border-white/10">
        <p className="font-mono text-xs uppercase tracking-[0.4em] mb-4 text-white/40">Data Ingestion</p>
        <h1 className="text-5xl font-medium tracking-tight">Upload.</h1>
      </div>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList>
          <TabsTrigger value="upload">Upload Images</TabsTrigger>
          <TabsTrigger value="preview" disabled={uploadedImages.length === 0}>
            Preview ({uploadedImages.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <ImageUploadZone
            onFilesSelected={handleFilesSelected}
            maxFiles={maxFiles}
            disabled={uploadStatus === "uploading"}
          />

          {uploadedImages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Uploaded Images</CardTitle>
                <CardDescription>
                  {uploadedImages.length} image{uploadedImages.length !== 1 ? "s" : ""} ready
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImagePreviewGrid
                  images={uploadedImages}
                  onRemove={handleRemoveImage}
                  onEdit={setSelectedImageId}
                />
              </CardContent>
            </Card>
          )}

          {selectedImage && (
            <MetadataForm
              metadata={selectedImage.metadata!}
              onChange={handleMetadataChange}
            />
          )}

          {uploadedImages.length > 0 && !selectedImage && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-white/50 text-center">
                  Click "Edit Metadata" on any image to add details, or upload all items with default metadata.
                </p>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => {
                setUploadedImages([]);
                setSelectedImageId(null);
              }}
              disabled={uploadedImages.length === 0 || uploadStatus === "uploading"}
            >
              Clear All
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!canUpload || uploadStatus === "uploading"}
            >
              {uploadStatus === "uploading" ? (
                <>
                  <Upload className="mr-2 h-4 w-4 animate-pulse" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload {uploadedImages.length} Item{uploadedImages.length !== 1 ? "s" : ""}
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          <ImagePreviewGrid
            images={uploadedImages}
            onRemove={handleRemoveImage}
            onEdit={setSelectedImageId}
          />
        </TabsContent>
      </Tabs>

      <UploadProgress
        progress={uploadProgress}
        status={uploadStatus}
        message={uploadMessage}
      />
    </div>
  );
};

