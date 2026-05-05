export type GarmentCategory = 
  | "Tops" 
  | "Bottoms" 
  | "Footwear" 
  | "Accessories" 
  | "Outerwear" 
  | "Dresses" 
  | "Other";

export type Season = "Spring" | "Summer" | "Fall" | "Winter" | "All-Season";

export type GarmentType = 
  | "Shirt" 
  | "T-Shirt" 
  | "Pants" 
  | "Jeans" 
  | "Shorts" 
  | "Dress" 
  | "Jacket" 
  | "Coat" 
  | "Sweater" 
  | "Shoes" 
  | "Boots" 
  | "Sneakers" 
  | "Hat" 
  | "Bag" 
  | "Jewelry" 
  | "Other";

export interface WardrobeItem {
  id: string;
  userId: string;
  imageUrl: string;
  thumbnailUrl?: string;
  name: string;
  category: GarmentCategory;
  type: GarmentType;
  color: string; // Hex color code
  season: Season;
  notes?: string;
  embedding?: number[]; // CLIP embedding vector
  createdAt: string;
  updatedAt: string;
  lastWorn?: string;
  wearCount: number;
  tags?: string[];
}

export interface WardrobeItemMetadata {
  name?: string;
  category: GarmentCategory;
  type: GarmentType;
  color: string;
  season: Season;
  notes?: string;
  tags?: string[];
}

export interface UploadedImage {
  file: File;
  preview: string;
  metadata?: WardrobeItemMetadata;
  id: string; // Temporary ID for preview
}

export interface WardrobeUploadResponse {
  success: boolean;
  items: WardrobeItem[];
  errors?: string[];
}

export interface WardrobeFilters {
  category?: GarmentCategory | "All";
  color?: string;
  season?: Season | "All";
  type?: GarmentType | "All";
  searchQuery?: string;
}

export interface WardrobeStats {
  totalItems: number;
  itemsByCategory: Record<GarmentCategory, number>;
  itemsBySeason: Record<Season, number>;
  mostWorn: WardrobeItem[];
  leastWorn: WardrobeItem[];
  rewearRate: number;
}

