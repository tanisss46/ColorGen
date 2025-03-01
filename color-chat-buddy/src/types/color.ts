export interface ColorState {
  value: string;
  isLocked: boolean;
}

export interface SavedColor {
  id: string;
  user_id: string;
  color_value: string;
  created_at: string;
}

export interface SavedPalette {
  id: string;
  user_id: string;
  colors: string[];
  created_at: string;
  deleted_at?: string | null;
}

// Type alias for better readability
export type Color = SavedColor;
