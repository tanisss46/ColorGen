import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { SavedColor, SavedPalette } from "@/types/color";

export const useSavedItems = (user: User | null) => {
  const [savedColors, setSavedColors] = useState<SavedColor[]>([]);
  const [savedPalettes, setSavedPalettes] = useState<SavedPalette[]>([]);

  useEffect(() => {
    if (user) {
      const fetchSavedItems = async () => {
        try {
          // Fetch palettes
          const { data: paletteData, error: paletteError } = await supabase
            .from('palettes')
            .select('id, user_id, colors, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (paletteError) {
            console.error('Error fetching palettes:', paletteError);
          } else {
            setSavedPalettes(paletteData || []);
          }

          // Fetch colors
          const { data: colorData, error: colorError } = await supabase
            .from('saved_colors')
            .select('id, user_id, color_value, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (colorError) {
            console.error('Error fetching colors:', colorError);
          } else {
            setSavedColors(colorData || []);
          }
        } catch (error) {
          console.error('Error in fetchSavedItems:', error);
        }
      };

      // Initial fetch
      fetchSavedItems();

      // Realtime subscriptions
      const paletteSubscription = supabase
        .channel('palettes')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'palettes',
            filter: `user_id=eq.${user.id}`
          }, 
          (payload) => {
            console.log('Palette change:', payload);
            // Refresh the entire list when there's a change
            fetchSavedItems();
          }
        )
        .subscribe();

      const colorSubscription = supabase
        .channel('saved_colors')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'saved_colors',
            filter: `user_id=eq.${user.id}`
          }, 
          (payload: any) => {
            console.log('Color change:', payload);
            switch (payload.eventType) {
              case 'INSERT':
                setSavedColors(prev => {
                  // Check if the color is already in the list
                  const exists = prev.some(color => color.id === payload.new.id);
                  if (!exists) {
                    return [payload.new, ...prev];
                  }
                  return prev;
                });
                break;
              case 'DELETE':
                setSavedColors(prev => prev.filter(color => color.id !== payload.old.id));
                break;
              default:
                break;
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(paletteSubscription);
        supabase.removeChannel(colorSubscription);
      };
    } else {
      setSavedColors([]);
      setSavedPalettes([]);
    }
  }, [user]);

  return {
    savedColors,
    setSavedColors,
    savedPalettes,
    setSavedPalettes,
  };
};
