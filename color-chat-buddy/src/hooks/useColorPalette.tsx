import { useState, useEffect } from "react";
import { ColorState } from "@/types/color";
import { generateInitialColors, generateRandomColor } from "@/utils/colorUtils";
import { toast } from "sonner";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export const useColorPalette = (
  user: User | null,
  setIsLoginOpen: (isOpen: boolean) => void,
  setSavedPalettes: (palettes: any[]) => void
) => {
  const [colors, setColors] = useState<ColorState[]>(() => generateInitialColors(5));
  const [history, setHistory] = useState<ColorState[][]>([generateInitialColors(5)]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Filter function that also records history for undo functionality
  const handleFilterColors = (colorHexCodes: string[]) => {
    // Convert hex codes to ColorState objects
    const newColorStates = colorHexCodes.map(hex => ({
      value: hex,
      isLocked: false
    }));
    
    // Add to history for undo functionality
    saveToHistory(newColorStates);
  };

  const saveToHistory = (newColors: ColorState[]) => {
    // Check if the previous colors are the same
    const lastColors = history[currentIndex];
    const hasChanged = !lastColors || lastColors.length !== newColors.length ||
      newColors.some((color, index) => color.value !== lastColors[index].value);

    // Only add to history if there's a change
    if (hasChanged) {
      // Clear history after the current index
      const newHistory = history.slice(0, currentIndex + 1);
      newHistory.push(newColors);
      
      setHistory(newHistory);
      setCurrentIndex(newHistory.length - 1);
      setColors(newColors);
    }
  };

  const generateNewPalette = () => {
    const newColors = colors.map(color => {
      // If the color is locked, keep the same value, otherwise generate a new color
      return {
        value: color.isLocked ? color.value : generateRandomColor(),
        isLocked: color.isLocked
      };
    });
    
    // Check if the previous colors are the same
    const hasChanged = newColors.some((newColor, index) => 
      !colors[index].isLocked && newColor.value !== colors[index].value
    );
    
    // If there's no change, regenerate colors for unlocked colors
    if (!hasChanged) {
      const finalColors = newColors.map((color, index) => {
        if (!color.isLocked) {
          return {
            ...color,
            value: generateRandomColor()
          };
        }
        return color;
      });
      saveToHistory(finalColors);
    } else {
      saveToHistory(newColors);
    }
  };

  const addColor = () => {
    if (colors.length >= 8) {
      toast.error("Maximum 8 colors allowed!");
      return;
    }
    saveToHistory([...colors, { value: generateRandomColor(), isLocked: false }]);
    toast.success("New color added!");
  };

  const removeColor = (newColors?: ColorState[]) => {
    if (colors.length <= 2) {
      toast.error("Minimum 2 colors required!");
      return;
    }
    
    // If new colors are provided, use them, otherwise remove the last color
    if (newColors) {
      saveToHistory(newColors);
    } else {
      saveToHistory(colors.slice(0, -1));
    }
    
    toast.success("Color removed!");
  };

  const handleLockChange = (index: number, isLocked: boolean) => {
    const newColors = [...colors];
    newColors[index] = { ...newColors[index], isLocked };
    setColors(newColors); // Update the state directly
    saveToHistory(newColors);
    toast.success(isLocked ? "Color locked!" : "Color unlocked!");
  };

  const handleColorChange = (index: number, newColor: string) => {
    const newColors = [...colors];
    // Only update the color at the specified index
    newColors[index] = { ...newColors[index], value: newColor };
    saveToHistory(newColors);
  };

  const undoPalette = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      setColors(history[newIndex]);
      toast.success("Changes reverted!");
    }
  };

  const redoPalette = () => {
    if (currentIndex < history.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setColors(history[newIndex]);
      toast.success("Changes reapplied!");
    }
  };

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  const handleSavePalette = async () => {
    if (!user) {
      toast.error("Please login to save palettes");
      setIsLoginOpen(true);
      return;
    }

    try {
      const colorValues = colors.map(color => color.value);

      const { error } = await supabase
        .from('palettes')
        .insert({
          user_id: user.id,
          colors: colorValues
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Palette saved successfully!");
      
      const { data: paletteData } = await supabase
        .from('palettes')
        .select('*')
        .order('created_at', { ascending: false });

      if (paletteData) {
        setSavedPalettes(paletteData);
      }
    } catch (error: any) {
      toast.error("Failed to save palette");
      console.error("Error saving palette:", error);
    }
  };

  // Drag işlemlerini kontrol eden fonksiyonlar ekleyin
  const startDragging = () => setIsDragging(true);
  const stopDragging = () => setIsDragging(false);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Sürükleme işlemi sırasında space tuşunu devre dışı bırak
      if (event.code === "Space" && !isDragging) {
        event.preventDefault();
        event.stopPropagation();
        generateNewPalette();
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [colors, isDragging]);

  return {
    colors,
    generateNewPalette,
    handleLockChange,
    addColor,
    removeColor,
    handleSavePalette,
    undoPalette,
    redoPalette,
    canUndo,
    canRedo,
    handleFilterColors,
    handleColorChange,
    setColors: saveToHistory,
    startDragging,
    stopDragging
  };
};
