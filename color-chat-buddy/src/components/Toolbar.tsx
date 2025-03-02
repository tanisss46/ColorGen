import { Button } from "@/components/ui/button";
import { Undo, Redo, Plus, Minus, Wand2, Save, Sparkles } from "lucide-react";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { SavedColor, SavedPalette } from "@/types/color";
import { ColorState } from "@/types/color";

interface ToolbarProps {
  onRemoveColor: () => void;
  onAddColor: () => void;
  onNewPalette: () => void;
  onSavePalette: () => void;
  onToggleChat: () => void;
  onUndo: () => void;
  onRedo: () => void;
  isChatOpen: boolean;
  onUpgradePro?: () => void;
  isPro?: boolean;
  canUndo: boolean;
  canRedo: boolean;
  savedColors?: SavedColor[];
  savedPalettes?: SavedPalette[];
  selectedColors?: ColorState[];
  selectedPalette?: SavedPalette | null;
  onSelectPalette?: (colors: string[]) => void;
  onSelectColor?: (color: string) => void;
  onDeleteColor?: (color: string) => void;
  onDeletePalette?: (id: string) => void;
}

const Toolbar = ({
  onRemoveColor,
  onAddColor,
  onNewPalette,
  onSavePalette,
  onToggleChat,
  onUndo,
  onRedo,
  isChatOpen,
  onUpgradePro,
  isPro = false,
  canUndo,
  canRedo,
  savedColors = [],
  savedPalettes = [],
  selectedColors = [],
  selectedPalette = null,
  onSelectPalette,
  onSelectColor,
  onDeleteColor,
  onDeletePalette
}: ToolbarProps) => {
  return (
    <div className="h-12 border-t border-b border-gray-200 flex items-center px-4 gap-2 justify-between bg-gray-100 relative">
      <TooltipProvider>
        {/* Center text for spacebar instruction - styled like coolors.co */}
        <div className="absolute left-0 right-0 flex justify-center items-center h-full z-0 pointer-events-none">
          <span className="text-[17px] text-gray-500 font-normal tracking-normal">Press the spacebar to generate color palettes!</span>
        </div>

        {/* Left side chat and upgrade buttons */}
        <div className="flex items-center gap-2 z-10 relative">
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className={`hover:bg-gray-100 flex items-center gap-2 px-3 ${
                    isChatOpen ? "bg-gray-200" : ""
                  } relative ai-assistant-btn`}
                  onClick={onToggleChat}
                  data-tooltip="Create color palettes with AI!"
                >
                  <Wand2
                    className={`${isChatOpen ? "text-blue-500" : "text-blue-500"} h-5 w-5 animate-pulse`}
                  />
                  <span
                    className={`text-sm ${
                      isChatOpen ? "font-medium text-blue-600" : "font-medium text-blue-600"
                    }`}
                  >
                    AI Assistant
                  </span>
                  {!isChatOpen && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                    </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Create color palettes with AI!</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {!isPro && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  onClick={onUpgradePro}
                  className="hover:bg-pink-50 px-3 gap-2 text-pink-500 group relative overflow-hidden transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-300 to-pink-400 opacity-0 group-hover:opacity-10 transition-opacity" />
                  <Sparkles className="h-4 w-4 animate-pulse text-pink-400" />
                  <span className="text-sm font-medium">Upgrade to Pro</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Please sign in to view subscription options</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Right side other buttons */}
        <div className="flex items-center gap-2 z-10 relative">
          <div className="flex items-center gap-2 border-r border-gray-200 pr-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onUndo}
                  className={`hover:bg-gray-100 ${
                    !canUndo ? "opacity-30 cursor-not-allowed" : ""
                  }`}
                  disabled={!canUndo}
                >
                  <Undo className="h-4 w-4 text-black" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Undo (Ctrl + Z)</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onRedo}
                  className={`hover:bg-gray-100 ${
                    !canRedo ? "opacity-30 cursor-not-allowed" : ""
                  }`}
                  disabled={!canRedo}
                >
                  <Redo className="h-4 w-4 text-black" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Redo (Ctrl + Shift + Z)</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onRemoveColor} className="hover:bg-gray-100">
                  <Minus className="h-4 w-4 text-black" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Remove color</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onAddColor} className="hover:bg-gray-100">
                  <Plus className="h-4 w-4 text-black" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add color</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" onClick={onNewPalette} className="hover:bg-gray-100 px-3 gap-2">
                  <Wand2 className="h-4 w-4 text-black" />
                  <span className="text-sm text-black">Mix Palette</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Generate new palette (Space)</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" onClick={onSavePalette} className="hover:bg-gray-100 px-3 gap-2">
                  <Save className="h-4 w-4 text-black" />
                  <span className="text-sm text-black">Save Palette</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Save palette</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </TooltipProvider>
    </div>
  );
};

export default Toolbar;