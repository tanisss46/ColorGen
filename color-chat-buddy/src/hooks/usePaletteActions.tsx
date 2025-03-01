import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { ColorState } from "@/types/color";

export const usePaletteActions = (
  user: User | null,
  setColors: (colors: ColorState[]) => void,
  setSavedPalettes: (palettes: any[]) => void,
  setSavedColors: (colors: any[]) => void,
  setIsLoginOpen: (isOpen: boolean) => void
) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handlePaletteSelect = (colors: string[]) => {
    const newColors = colors.map(color => ({
      value: color,
      isLocked: false
    }));
    setColors(newColors);
  };

  const handleColorSelect = (color: string) => {
    // Only show the selected color
    setColors([{ value: color, isLocked: false }]);
  };

  const handleSaveColor = async (color: string) => {
    if (!user) {
      toast.error("Please login to save colors");
      setIsLoginOpen(true);
      return;
    }

    try {
      const normalizedColor = color.toLowerCase();

      // Check if color already exists
      const { data: existingColors } = await supabase
        .from('saved_colors')
        .select('*')
        .eq('user_id', user.id)
        .eq('color_value', normalizedColor);

      if (existingColors && existingColors.length > 0) {
        toast.error("This color is already in your favorites!");
        return;
      }

      const { data: newColor, error: insertError } = await supabase
        .from('saved_colors')
        .insert([{
          user_id: user.id,
          color_value: normalizedColor,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      // Immediately update the local state
      setSavedColors(prev => [newColor, ...prev]);
      toast.success("Color saved to favorites!");
    } catch (error: any) {
      console.error("Error saving color:", error);
      toast.error("Failed to save color");
    }
  };

  const handleUnsaveColor = async (color: string) => {
    if (!user) {
      toast.error("Please login to remove colors");
      setIsLoginOpen(true);
      return;
    }

    try {
      const normalizedColor = color.toLowerCase();

      const { error: deleteError } = await supabase
        .from('saved_colors')
        .delete()
        .eq('user_id', user.id)
        .eq('color_value', normalizedColor);

      if (deleteError) throw deleteError;

      setSavedColors(prev => prev.filter(c => c.color_value.toLowerCase() !== normalizedColor));
      toast.success("Color removed from favorites!");
    } catch (error: any) {
      console.error("Error removing color:", error);
      toast.error("Failed to remove color from favorites");
    }
  };

  const handleDeleteColor = async (color: string) => {
    if (!user) {
      toast.error("Please login to delete colors");
      setIsLoginOpen(true);
      return;
    }

    try {
      const normalizedColor = color.toLowerCase();

      const { error: deleteError } = await supabase
        .from('saved_colors')
        .delete()
        .eq('user_id', user.id)
        .eq('color_value', normalizedColor);

      if (deleteError) throw deleteError;

      setSavedColors(prev => prev.filter(c => c.color_value.toLowerCase() !== normalizedColor));
      toast.success("Color deleted successfully!");
    } catch (error: any) {
      console.error("Error deleting color:", error);
      toast.error("Failed to delete color");
    }
  };

  const handleSavePalette = async (colors: string[]) => {
    if (!user) {
      toast.error("Please login to save palette");
      setIsLoginOpen(true);
      return;
    }

    try {
      // Check if palette already exists (same colors in any order)
      const { data: existingPalettes } = await supabase
        .from('palettes')
        .select('*')
        .eq('user_id', user.id);

      const paletteExists = existingPalettes?.some(p => {
        const existingColors = new Set(p.colors);
        return colors.length === existingColors.size && 
               colors.every(c => existingColors.has(c));
      });

      if (paletteExists) {
        toast.error("This palette is already in your favorites!");
        return;
      }

      const { data: newPalette, error: insertError } = await supabase
        .from('palettes')
        .insert([{
          user_id: user.id,
          colors: colors,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      setSavedPalettes(prev => [...prev, newPalette]);
      toast.success("Palette saved to favorites!");
    } catch (error: any) {
      console.error("Error saving palette:", error);
      toast.error("Failed to save palette");
    }
  };

  const handleDeletePalette = async (id: string) => {
    if (!user) {
      toast.error("Please login to delete palettes");
      setIsLoginOpen(true);
      return;
    }

    if (isDeleting) return;

    try {
      setIsDeleting(true);
      
      // First verify the palette exists and belongs to the user
      const { data: palette, error: fetchError } = await supabase
        .from('palettes')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (fetchError || !palette) {
        throw new Error('Palette not found or access denied');
      }

      // Try to delete with hard delete option
      const { error: deleteError } = await supabase
        .from('palettes')
        .delete()
        .match({ id: id, user_id: user.id });

      if (deleteError) {
        throw deleteError;
      }

      // Verify deletion
      const { data: verifyData } = await supabase
        .from('palettes')
        .select('id')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (verifyData) {
        // If palette still exists, try force delete
        const { error: forceDeleteError } = await supabase
          .from('palettes')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id); // Only delete if not soft deleted

        if (forceDeleteError) {
          throw new Error('Failed to delete palette after multiple attempts');
        }
      }

      // Update UI
      setSavedPalettes(prev => prev.filter(p => p.id !== id));
      toast.success("Palette deleted successfully!");

    } catch (error: any) {
      console.error("Error deleting palette:", error);
      toast.error(error.message || "Failed to delete palette");
      
      // Refresh the palette list to ensure UI is in sync
      const { data: currentPalettes } = await supabase
        .from('palettes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setSavedPalettes(currentPalettes || []);
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    handleSaveColor,
    handleUnsaveColor,
    handleSavePalette,
    handleDeletePalette,
    handleDeleteColor,
    handlePaletteSelect,
    handleColorSelect
  };
};
