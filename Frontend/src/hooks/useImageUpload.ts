import { useState, useCallback } from "react";
import { uploadApi } from "@/lib/api/upload";
import { compressImage, createImagePreview, validateImageFile } from "@/lib/utils/imageUtils";
import type { UploadedImage, WardrobeItemMetadata } from "@/types/wardrobe";
import type { UploadProgress } from "@/lib/api/upload";

export const useImageUpload = () => {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addImages = useCallback(async (files: File[]) => {
    const newImages: UploadedImage[] = [];

    for (const file of files) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setError(`${file.name}: ${validation.error}`);
        continue;
      }

      try {
        const preview = await createImagePreview(file);
        const id = `${Date.now()}-${Math.random()}`;
        newImages.push({
          id,
          file,
          preview,
          metadata: {
            category: "Tops",
            type: "Shirt",
            color: "#000000",
            season: "All-Season",
          },
        });
      } catch (err) {
        setError(`Failed to process ${file.name}`);
      }
    }

    setUploadedImages((prev) => [...prev, ...newImages]);
    return newImages;
  }, []);

  const removeImage = useCallback((id: string) => {
    setUploadedImages((prev) => prev.filter((img) => img.id !== id));
  }, []);

  const updateMetadata = useCallback((id: string, metadata: WardrobeItemMetadata) => {
    setUploadedImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, metadata } : img))
    );
  }, []);

  const uploadImages = useCallback(async () => {
    if (uploadedImages.length === 0) return;

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Compress all images
      const compressedFiles = await Promise.all(
        uploadedImages.map((img) => compressImage(img.file))
      );

      // Prepare metadata
      const metadataArray = uploadedImages.map((img) => img.metadata!);

      // Upload batch
      const result = await uploadApi.uploadBatch(
        compressedFiles,
        metadataArray,
        (progress) => {
          setUploadProgress(progress.percentage);
        }
      );

      // Clear uploaded images on success
      setUploadedImages([]);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Upload failed";
      setError(errorMessage);
      throw err;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [uploadedImages]);

  const clearAll = useCallback(() => {
    setUploadedImages([]);
    setError(null);
    setUploadProgress(0);
  }, []);

  return {
    uploadedImages,
    uploadProgress,
    isUploading,
    error,
    addImages,
    removeImage,
    updateMetadata,
    uploadImages,
    clearAll,
  };
};

