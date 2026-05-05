export type ColorPreference = 
  | "Neutral" 
  | "Bold" 
  | "Pastel" 
  | "Dark" 
  | "Light" 
  | "Mixed";

export type StyleAesthetic = 
  | "Minimalist" 
  | "Classic" 
  | "Casual" 
  | "Formal" 
  | "Bohemian" 
  | "Streetwear" 
  | "Vintage" 
  | "Modern" 
  | "Eclectic";

export type FitPreference = "Slim" | "Regular" | "Loose" | "Oversized";

export interface ColorPalette {
  primary: string[]; // Array of hex colors
  secondary: string[];
  accent: string[];
  avoid?: string[]; // Colors to avoid
}

export interface StyleProfile {
  userId: string;
  colorPreference: ColorPreference;
  styleAesthetic: StyleAesthetic[];
  colorPalette: ColorPalette;
  fitPreference: FitPreference;
  preferredCategories: string[];
  avoidedCategories?: string[];
  notes?: string;
  measurements?: UserMeasurements;
  createdAt: string;
  updatedAt: string;
}

export interface UserMeasurements {
  height?: string;
  weight?: string;
  collar?: string;
  waist?: string;
  inseam?: string;
  shoeSize?: string;
  chest?: string;
  hips?: string;
  [key: string]: string | undefined;
}

export interface StyleQuestionnaireStep {
  id: string;
  title: string;
  question: string;
  type: "multiple-choice" | "color-picker" | "text" | "multi-select";
  options?: string[];
  required: boolean;
}

export interface StyleQuestionnaireResponse {
  stepId: string;
  answer: string | string[] | ColorPalette;
}

export interface StylePreferences {
  colors: ColorPalette;
  aesthetics: StyleAesthetic[];
  fit: FitPreference;
  categories: string[];
  notes?: string;
}

