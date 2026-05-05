import apiClient from "./client";
import type { WardrobeItem } from "@/types/wardrobe";

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export const uploadApi = {
  // Upload single image with metadata
  uploadImage: async (
    file: File,
    metadata: {
      name?: string;
      category: string;
      type: string;
      color: string;
      season: string;
      notes?: string;
    },
    onProgress?: (progress: UploadProgress) => void
  ): Promise<WardrobeItem> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("metadata", JSON.stringify(metadata));

    const response = await apiClient.post("/upload/image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          onProgress({
            loaded: progressEvent.loaded,
            total: progressEvent.total,
            percentage: Math.round((progressEvent.loaded * 100) / progressEvent.total),
          });
        }
      },
    });

    return response.data;
  },

  // Batch upload multiple images
  uploadBatch: async (
    files: File[],
    metadataArray: Array<{
      name?: string;
      category: string;
      type: string;
      color: string;
      season: string;
      notes?: string;
    }>,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<{ items: WardrobeItem[]; errors?: string[] }> => {
    const formData = new FormData();

    files.forEach((file, index) => {
      formData.append("files", file);
      formData.append(`metadata_${index}`, JSON.stringify(metadataArray[index] || {}));
    });

    const response = await apiClient.post("/upload/batch", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          onProgress({
            loaded: progressEvent.loaded,
            total: progressEvent.total,
            percentage: Math.round((progressEvent.loaded * 100) / progressEvent.total),
          });
        }
      },
    });

    return response.data;
  },
};

