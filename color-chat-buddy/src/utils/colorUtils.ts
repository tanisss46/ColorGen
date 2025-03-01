import { colornames } from 'color-name-list';
import nearestColor from 'nearest-color';

export const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};

export const rgbToHex = (r: number, g: number, b: number) => {
  const toHex = (n: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
};

export const hslToRgb = (h: number, s: number, l: number) => {
  h = h / 360;
  s = s / 100;
  l = l / 100;

  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
};

export const rgbToHsl = (r: number, g: number, b: number) => {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h: number = 0;
  let s: number;
  const l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
};

// Helper functions for working with the HSL color model
export function hexToHSL(hex: string): { h: number; s: number; l: number } {
  // First convert to RGB
  const rgb = hexToRgb(hex);
  if (!rgb) return { h: 0, s: 0, l: 0 };

  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }

    h = Math.round(h * 60);
  }

  s = Math.round(s * 100);
  const lightness = Math.round(l * 100);

  return { h, s, l: lightness };
}

export function HSLToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (0 <= h && h < 60) {
    r = c; g = x; b = 0;
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c;
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x;
  }

  const rHex = Math.round((r + m) * 255).toString(16).padStart(2, '0');
  const gHex = Math.round((g + m) * 255).toString(16).padStart(2, '0');
  const bHex = Math.round((b + m) * 255).toString(16).padStart(2, '0');

  return `#${rHex}${gHex}${bHex}`.toUpperCase();
}

// Configuration for nearest-color to find color names
const namedColors = colornames.reduce((o, { name, hex }) => Object.assign(o, { [name]: hex }), {});
const nearest = nearestColor.from(namedColors);

// Get specific color name from hex
export function getColorName(hex: string): string {
  try {
    const result = nearest(hex);
    if (result && result.name) {
      return result.name;
    }
    return '';
  } catch (error) {
    console.error('Error getting color name:', error);
    return '';
  }
}

// Color scheme types
export type ColorScheme = 'complementary' | 'analogous' | 'triadic' | 'split_complementary' | 'monochromatic';

// Random color scheme selection
export function selectColorScheme(): ColorScheme {
  const schemes: ColorScheme[] = ['complementary', 'analogous', 'triadic', 'split_complementary', 'monochromatic'];
  const weights = [0.3, 0.25, 0.2, 0.15, 0.1];
  
  const random = Math.random();
  let sum = 0;
  for (let i = 0; i < weights.length; i++) {
    sum += weights[i];
    if (random < sum) return schemes[i];
  }
  return schemes[0];
}

// Completely random color generation
export function generateRandomColor(): string {
  // Using HSL for more controlled color generation
  const h = Math.floor(Math.random() * 360); // 0-360 range for hue
  const s = Math.floor(Math.random() * 101); // 0-100 range for saturation
  const l = Math.floor(Math.random() * 81) + 10; // 10-90 range for lightness (avoiding very dark and very light tones)
  
  return HSLToHex(h, s, l);
}

// Harmonious color generation
export function generateHarmoniousColor(baseColor: string, scheme: ColorScheme): string {
  const hsl = hexToHSL(baseColor);
  let h = hsl.h;
  let s = hsl.s;
  let l = hsl.l;

  // Hue change based on color scheme
  switch (scheme) {
    case 'complementary':
      h = (h + 180) % 360;
      s = Math.min(100, Math.max(20, s + (Math.random() * 40 - 20))); // ±20% saturation
      l = Math.min(90, Math.max(10, l + (Math.random() * 40 - 20))); // ±20% lightness
      break;
    case 'analogous':
      h = (h + (Math.random() > 0.5 ? 30 : -30)) % 360;
      if (h < 0) h += 360;
      s = Math.min(100, Math.max(20, s + (Math.random() * 30 - 15))); // ±15% saturation
      l = Math.min(90, Math.max(10, l + (Math.random() * 30 - 15))); // ±15% lightness
      break;
    case 'triadic':
      h = (h + (Math.random() > 0.5 ? 120 : 240)) % 360;
      s = Math.min(100, Math.max(20, s + (Math.random() * 40 - 20))); // ±20% saturation
      l = Math.min(90, Math.max(10, l + (Math.random() * 40 - 20))); // ±20% lightness
      break;
    case 'split_complementary':
      h = (h + 180 + (Math.random() > 0.5 ? 30 : -30)) % 360;
      if (h < 0) h += 360;
      s = Math.min(100, Math.max(20, s + (Math.random() * 40 - 20))); // ±20% saturation
      l = Math.min(90, Math.max(10, l + (Math.random() * 40 - 20))); // ±20% lightness
      break;
    case 'monochromatic':
      // Hue remains the same
      s = Math.min(100, Math.max(20, s + (Math.random() * 60 - 30))); // ±30% saturation
      l = Math.min(90, Math.max(10, l + (Math.random() * 60 - 30))); // ±30% lightness
      break;
  }

  return HSLToHex(h, s, l);
}

// Palette regeneration function
export function regeneratePalette(colors: { color: string; locked: boolean }[]): { color: string; locked: boolean }[] {
  const lockedColors = colors.filter(c => c.locked);
  
  return colors.map(color => {
    if (color.locked) return color;

    if (lockedColors.length === 0) {
      // If no colors are locked, generate completely random colors
      return { ...color, color: generateRandomColor() };
    }
    
    // Select a random locked color as the base
    const baseColor = lockedColors[Math.floor(Math.random() * lockedColors.length)].color;
    const scheme = selectColorScheme();
    return { ...color, color: generateHarmoniousColor(baseColor, scheme) };
  });
}

// Generate initial colors
export const generateInitialColors = (count: number = 5): { value: string; isLocked: boolean }[] => {
  return Array(count).fill(null).map(() => ({
    value: generateRandomColor(),
    isLocked: false
  }));
}

export const isColorLight = (color: string): boolean => {
  const rgb = hexToRgb(color);
  const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  return brightness > 128;
};
