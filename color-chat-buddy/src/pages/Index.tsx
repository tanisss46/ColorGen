import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSavedItems } from "@/hooks/useSavedItems";
import { useColorPalette } from "@/hooks/useColorPalette";
import { usePaletteActions } from "@/hooks/usePaletteActions";
import MainLayout from "@/layouts/MainLayout";
import { ColorList } from "@/components/ColorList";
import { ChatPanel } from "@/components/ChatPanel";
import SubscriptionDialog from "@/components/SubscriptionDialog";
import { ColorState } from "@/types/color";
import { generateRandomColor } from "@/utils/colorUtils";
import { toast } from "sonner";

const Index = () => {
  const { user, isLoginOpen, setIsLoginOpen, handleLogout } = useAuth();
  const { savedColors, setSavedColors, savedPalettes, setSavedPalettes } = useSavedItems(user);
  const {
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
    setColors
  } = useColorPalette(user, setIsLoginOpen, setSavedPalettes);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [chatWidth, setChatWidth] = useState(320);
  const [shouldOpenSubscriptionAfterLogin, setShouldOpenSubscriptionAfterLogin] = useState(false);

  const {
    handleSaveColor,
    handleUnsaveColor,
    handleDeleteColor,
    handleDeletePalette,
    handlePaletteSelect,
    handleColorSelect
  } = usePaletteActions(user, colors, setSavedPalettes, setSavedColors, setIsLoginOpen);

  const handleColorUpdate = (index: number, newColor: string) => {
    handleColorChange(index, newColor);
  };

  const handleColorDelete = (colorToDelete: string) => {
    if (colors.length <= 2) {
      return; // Minimum 2 colors required
    }
    const newColors = colors.filter(color => color.value !== colorToDelete);
    removeColor(newColors);
  };

  const handleAddColorBetween = () => {
    if (colors.length >= 8) {
      toast.error("Maximum 8 colors allowed!");
      return;
    }
    const newColors = [...colors, { value: generateRandomColor(), isLocked: false }];
    addColor(newColors);
  };

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  const handleUpgradePro = () => {
    if (!user) {
      setShouldOpenSubscriptionAfterLogin(true);
      setIsLoginOpen(true);
      return;
    }
    setIsSubscriptionOpen(true);
  };

  useEffect(() => {
    const handleOpenLoginDialog = () => setIsLoginOpen(true);
    window.addEventListener('open-login-dialog', handleOpenLoginDialog);
    return () => window.removeEventListener('open-login-dialog', handleOpenLoginDialog);
  }, [setIsLoginOpen]);

  useEffect(() => {
    if (user && shouldOpenSubscriptionAfterLogin) {
      setIsSubscriptionOpen(true);
      setShouldOpenSubscriptionAfterLogin(false);
    }
  }, [user, shouldOpenSubscriptionAfterLogin]);

  return (
    <MainLayout
      user={user}
      isLoginOpen={isLoginOpen}
      setIsLoginOpen={setIsLoginOpen}
      handleLogout={handleLogout}
      savedColors={savedColors}
      savedPalettes={savedPalettes}
      isChatOpen={isChatOpen}
      onPaletteSelect={(colors) => handlePaletteSelect(colors)}
      onColorSelect={(color) => handleColorSelect(color)}
      onDeleteColor={handleDeleteColor}
      onDeletePalette={handleDeletePalette}
      onRemoveColor={() => removeColor()}
      onAddColor={handleAddColorBetween}
      onNewPalette={generateNewPalette}
      onSavePalette={handleSavePalette}
      onToggleChat={toggleChat}
      onUndo={undoPalette}
      onRedo={redoPalette}
      onUpgradePro={handleUpgradePro}
      canUndo={canUndo}
      canRedo={canRedo}
    >
      <div className="flex">
        {isChatOpen && (
          <div 
            style={{ 
              width: `${chatWidth}px`,
              minWidth: `${chatWidth}px`, 
              transition: 'width 0.2s ease' 
            }}
          >
            <ChatPanel 
              isOpen={isChatOpen}
              onClose={() => setIsChatOpen(false)}
              width={chatWidth}
              onWidthChange={setChatWidth}
              onFilterColors={handleFilterColors}
            />
          </div>
        )}
        
        <div className="flex-1">
          <ColorList
            colors={colors}
            onColorChange={handleColorUpdate}
            onDeleteColor={(index) => {
              const newColors = [...colors];
              newColors.splice(index, 1);
              removeColor(newColors);
            }}
            onReorder={(sourceIndex, destinationIndex) => {
              // Take the entire color array and just change the ordering
              const newColors = [...colors];
              const [removed] = newColors.splice(sourceIndex, 1);
              newColors.splice(destinationIndex, 0, removed);
              
              // Directly update the entire color palette - without changing colors
              setColors(newColors);
            }}
            onLockChange={handleLockChange}
            savedColors={savedColors}
            isAuthenticated={!!user}
            onSaveColor={handleSaveColor}
            onUnsaveColor={handleUnsaveColor}
          />
        </div>
      </div>

      <SubscriptionDialog
        open={isSubscriptionOpen}
        setOpen={setIsSubscriptionOpen}
        refreshSubscription={async () => {
          // Refresh subscription logic here if needed
        }}
      />
    </MainLayout>
  );
};

export default Index;
