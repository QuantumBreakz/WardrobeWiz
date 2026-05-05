import imageCompression from "browser-image-compression";

export interface ImageCompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
}

/**
 * Compress an image file before upload
 */
export const compressImage = async (
  file: File,
  options: ImageCompressionOptions = {}
): Promise<File> => {
  const compressionOptions: ImageCompressionOptions = {
    maxSizeMB: options.maxSizeMB || 1,
    maxWidthOrHeight: options.maxWidthOrHeight || 1920,
    useWebWorker: options.useWebWorker ?? true,
  };

  try {
    const compressedFile = await imageCompression(file, compressionOptions);
    return compressedFile;
  } catch (error) {
    console.error("Image compression error:", error);
    // Return original file if compression fails
    return file;
  }
};

/**
 * Create a preview URL from a file
 */
export const createImagePreview = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string);
      } else {
        reject(new Error("Failed to create preview"));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Validate image file
 */
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: "Invalid file type. Please upload JPEG, PNG, or WebP images.",
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: "File size too large. Maximum size is 10MB.",
    };
  }

  return { valid: true };
};

/**
 * Get image dimensions
 */
export const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
};

/**
 * Convert file to base64
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        resolve(reader.result as string);
      } else {
        reject(new Error("Failed to convert file to base64"));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

