import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Lock, LockOpen, Heart, Grip, X, Palette, Copy } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { ColorPicker } from './ColorPicker';
import { hexToRgb, rgbToHex, isColorLight, getColorName } from "@/utils/colorUtils";

interface ColorCardProps {
  color: string;
  onLockChange?: (isLocked: boolean) => void;
  onSave?: () => void;
  isAuthenticated?: boolean;
  isSaved?: boolean;
  onUnsave?: (color: string) => void;
  onDelete?: () => void;
  onColorChange?: (oldColor: string, newColor: string) => void;
  dragHandleProps?: any;
}

export const ColorCard: React.FC<ColorCardProps> = ({ 
  color, 
  onLockChange, 
  onSave, 
  isAuthenticated = false, 
  isSaved = false, 
  onUnsave,
  onDelete,
  onColorChange,
  dragHandleProps
}) => {
  const [copied, setCopied] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isFavorite, setIsFavorite] = useState(isSaved);
  const [isEditing, setIsEditing] = useState(false);
  const [localColor, setLocalColor] = useState(color);
  const [rgb, setRgb] = useState(() => hexToRgb(color));
  const [colorName, setColorName] = useState(() => getColorName(color));

  useEffect(() => {
    setIsFavorite(isSaved);
  }, [isSaved]);

  useEffect(() => {
    setLocalColor(color);
    setRgb(hexToRgb(color));
    setColorName(getColorName(color));
  }, [color]);

  const copyToClipboard = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isEditing) return;

    try {
      await navigator.clipboard.writeText(color.toUpperCase());
      toast.success("Color copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy color!");
    }
  };

  const toggleLock = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newLockedState = !isLocked;
    setIsLocked(newLockedState);
    onLockChange?.(newLockedState);
    toast.success(isLocked ? "Color unlocked" : "Color locked");
  };

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error("Please login to save colors");
      return;
    }

    if (isFavorite) {
      onUnsave?.(color);
    } else {
      onSave?.();
    }
    setIsFavorite(!isFavorite);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete();
    }
  };

  const handleColorChange = useCallback((newColor: string, shouldUpdate: boolean = false) => {
    // Update local color
    setLocalColor(newColor);
    setRgb(hexToRgb(newColor));
    setColorName(getColorName(newColor));
    
    // Only notify parent on final selection from picker
    if (shouldUpdate && onColorChange && newColor !== color) {
      onColorChange(color, newColor);
    }
  }, [onColorChange, color]);

  const handleRgbChange = (component: 'r' | 'g' | 'b', value: number) => {
    const newRgb = { ...rgb, [component]: Math.min(255, Math.max(0, value)) };
    setRgb(newRgb);
    const newColor = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    // Only update local color
    setLocalColor(newColor);
  };

  

  return (
    <div 
      className="relative w-full h-full flex flex-col items-center justify-between group"
      style={{ 
        backgroundColor: localColor,
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
      onClick={(e) => {
        if (!isEditing) {
          copyToClipboard();
        }
      }}
    >
      <div className="w-full flex-1 flex flex-col items-center justify-center gap-3 mt-[-40px]">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={handleDelete}
                className={`p-1.5 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all opacity-0 group-hover:opacity-100 ${
                  isColorLight(localColor) ? 'text-gray-900' : 'text-white'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Delete color</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={toggleLock}
                className={`p-1.5 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all opacity-0 group-hover:opacity-100 ${
                  isColorLight(localColor) ? 'text-gray-900' : 'text-white'
                }`}
              >
                {isLocked ? (
                  <Lock className="w-4 h-4" />
                ) : (
                  <LockOpen className="w-4 h-4" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isLocked ? "Unlock color" : "Lock color"}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={toggleFavorite}
                className={`p-1.5 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all opacity-0 group-hover:opacity-100 ${
                  isColorLight(localColor) ? 'text-gray-900' : 'text-white'
                }`}
              >
                <Heart 
                  className={`w-4 h-4 transition-all ${isFavorite ? 'fill-current' : ''}`}
                />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isFavorite ? "Remove from favorites" : "Add to favorites"}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(e);
                }}
                className={`p-1.5 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all opacity-0 group-hover:opacity-100 ${
                  isColorLight(localColor) ? 'text-gray-900' : 'text-white'
                }`}
              >
                <Copy className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Copy color</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(!isEditing);
                }}
                className={`p-1.5 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all opacity-0 group-hover:opacity-100 ${
                  isColorLight(localColor) ? 'text-gray-900' : 'text-white'
                } ${isEditing ? 'bg-white/30' : ''}`}
              >
                <Palette className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Edit color</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div 
                {...dragHandleProps}
                className={`p-3 rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white/20 active:bg-white/30 transition-all opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing touch-manipulation select-none ${
                  isColorLight(localColor) ? 'text-gray-900' : 'text-white'
                }`}
                style={{ 
                  touchAction: 'none',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  MozUserSelect: 'none',
                  msUserSelect: 'none'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <Grip className="w-7 h-7" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Drag to reorder colors</p>
            </TooltipContent>
          </Tooltip>

        </TooltipProvider>
      </div>
      
      <div 
        className="absolute bottom-0 left-0 right-0 w-full flex flex-col items-center justify-center"
        style={{ 
          paddingBottom: '80px',
          transform: 'translateZ(0)', 
          willChange: 'transform', 
          zIndex: 10,
          pointerEvents: 'none'
        }}
      >
        <Popover open={isEditing} onOpenChange={(open) => {
          setIsEditing(open);
        }}>
          <PopoverTrigger asChild>
            <button 
              className={`text-[1.70rem] font-sans font-bold tracking-wide leading-tight ${
                isColorLight(localColor) ? 'text-gray-900 hover:text-gray-700' : 'text-white hover:text-white/90'
              } px-3 py-2 rounded-lg transition-all cursor-pointer hover:scale-105`}
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              style={{ pointerEvents: 'auto' }}
            >
              {localColor.toUpperCase().replace('#', '')}
            </button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-[280px] p-4 rounded-xl shadow-lg border-0"
            onClick={(e) => e.stopPropagation()}
            align="center"
            sideOffset={5}
          >
            <div className="color-picker-container">
              <ColorPicker
                color={localColor}
                onChange={(color) => {
                  // Update local color and name immediately during changes
                  setLocalColor(color);
                  setRgb(hexToRgb(color));
                  setColorName(getColorName(color));
                }}
                onFinalChange={(color) => {
                  // Notify parent on final change
                  handleColorChange(color, true);
                }}
                rgb={rgb}
                onRgbChange={(component, value) => {
                  const newRgb = { ...rgb, [component]: Math.min(255, Math.max(0, value)) };
                  setRgb(newRgb);
                  const newColor = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
                  // Update both color and name
                  setLocalColor(newColor);
                  setColorName(getColorName(newColor));
                }}
              />
            </div>
          </PopoverContent>
        </Popover>
        
        <span 
          className={`text-l font-medium transition-colors ${
            isColorLight(localColor) ? 'text-gray-700' : 'text-gray-300' 
          }`}
          style={{ 
            display: 'block',
            textAlign: 'center',
            marginTop: '8px'
          }}
        >
          {colorName}
        </span>
      </div>
    </div>
  );
};
