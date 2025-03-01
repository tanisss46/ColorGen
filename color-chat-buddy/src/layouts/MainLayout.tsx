import Navbar from "@/components/Navbar";
import Toolbar from "@/components/Toolbar";
import LoginDialog from "@/components/LoginDialog";
import { WelcomeModal } from "@/components/WelcomeModal";
import { AINotification } from "@/components/AINotification";
import { PropsWithChildren, useState, useEffect } from "react";
import { SavedColor, SavedPalette } from "@/types/color";
import { useSubscription } from "@/hooks/useSubscription";
import supabase from "@/utils/supabase";

interface MainLayoutProps extends PropsWithChildren {
  user: any;
  savedColors?: string[];
  savedPalettes?: SavedPalette[];
  selectedColors?: string[];
  selectedPalette?: SavedPalette | null;
  isChatOpen?: boolean;
  onToggleChat?: () => void;
  onSaveColor?: () => void;
  onDeleteColor?: () => void;
  onSavePalette?: () => void;
  onDeletePalette?: () => void;
  onSelectPalette?: () => void;
  onClearSelection?: () => void;
  onSelectColor?: () => void;
  setIsLoginOpen?: (open: boolean) => void;
  isLoginOpen?: boolean;
  history?: any[];
  historyIndex?: number;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onRemoveColor?: () => void;
  onAddColor?: () => void;
  onNewPalette?: () => void;
  handleLogout?: () => Promise<void>;
  onUpgradePro?: () => void;
}

const MainLayout = ({
  children,
  user,
  savedColors = [],
  savedPalettes = [],
  selectedColors = [],
  selectedPalette = null,
  isChatOpen = false,
  onToggleChat,
  onSaveColor,
  onDeleteColor,
  onSavePalette,
  onDeletePalette,
  onSelectPalette,
  onClearSelection,
  onSelectColor,
  setIsLoginOpen,
  isLoginOpen = false,
  history = [],
  historyIndex = 0,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onRemoveColor,
  onAddColor,
  onNewPalette,
  handleLogout,
  onUpgradePro
}: MainLayoutProps) => {
  const { subscription } = useSubscription(user?.id);
  const [showAINotification, setShowAINotification] = useState(false);
  
  // Show AINotification on first visit if notification isn't shown before
  useEffect(() => {
    if (!isChatOpen && localStorage.getItem('aiNotificationClosed') !== 'true') {
      setShowAINotification(true);
    }
  }, [isChatOpen]);

  // Handle AI Assistant button click - hide notification if it's shown
  const handleToggleChat = () => {
    if (showAINotification) {
      setShowAINotification(false);
      localStorage.setItem('aiNotificationClosed', 'true');
    }
    onToggleChat?.();
  };

  return (
    <div className="h-screen flex flex-col">
      <Navbar
        user={user}
        savedColors={savedColors || []}
        savedPalettes={savedPalettes || []}
        onLogin={() => setIsLoginOpen?.(true)}
        onLogout={handleLogout || (async () => {})}
        onPaletteSelect={onSelectPalette}
        onColorSelect={onSelectColor}
        onDeleteColor={onDeleteColor}
        onDeletePalette={onDeletePalette}
        onSavePalette={onSavePalette}
        selectedColors={selectedColors}
        selectedPalette={selectedPalette}
        onOpenLogin={() => setIsLoginOpen?.(true)}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={onUndo}
        onRedo={onRedo}
        isPro={subscription?.status === 'active'}
      />
      <Toolbar
        isChatOpen={isChatOpen}
        onToggleChat={handleToggleChat}
        onRemoveColor={onRemoveColor}
        onAddColor={onAddColor}
        onNewPalette={onNewPalette}
        onSavePalette={onSavePalette}
        onUndo={onUndo}
        onRedo={onRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        onUpgradePro={onUpgradePro || (() => setIsLoginOpen?.(true))}
        isPro={subscription?.status === 'active'}
        savedColors={savedColors}
        savedPalettes={savedPalettes}
        selectedColors={selectedColors}
        selectedPalette={selectedPalette}
        onDeleteColor={onDeleteColor}
        onDeletePalette={onDeletePalette}
        onSelectPalette={onSelectPalette}
        onSelectColor={onSelectColor}
      />
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
      <LoginDialog isOpen={isLoginOpen} onClose={() => setIsLoginOpen?.(false)} />
      <WelcomeModal onClose={() => handleToggleChat()} />
      {showAINotification && !isChatOpen && <AINotification onClose={() => setShowAINotification(false)} />}
    </div>
  );
};

export default MainLayout;
