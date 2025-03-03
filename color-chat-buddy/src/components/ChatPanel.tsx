import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChatHeader } from "./ChatHeader";
import { ColorHint } from "./ColorHint";
import { useChatMessages } from "@/hooks/useChatMessages";
import { Loader2, Send } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { X } from "lucide-react";

interface ChatPanelProps {
  onFilterColors: (colors: string[]) => void;
  isOpen: boolean;
  onClose: () => void;
  onWidthChange: (width: number) => void;
  width?: number;
}

export const ChatPanel = ({
  onFilterColors,
  isOpen,
  onClose,
  onWidthChange,
  width: initialWidth = 320
}: ChatPanelProps) => {
  const {
    messages,
    input,
    setInput,
    isLoading,
    handleSubmit,
    handleKeyDown,
    messagesEndRef,
    formatMessage,
    hasReceivedFirstResponse,
    freeGenerationUsed,
    showSignupPopup,
    setShowSignupPopup,
    dismissPopup
  } = useChatMessages(onFilterColors);
  
  const { user } = useAuth();

  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [width, setWidth] = useState(initialWidth);
  const [userIsScrolling, setUserIsScrolling] = useState(false);
  const [showChatHint, setShowChatHint] = useState(false);
  const [showInputHint, setShowInputHint] = useState(false);

  // Show help hint only when chat panel opens and there are no messages
  useEffect(() => {
    if (isOpen && messages.length === 0 && !localStorage.getItem('chatHintShown')) {
      setShowChatHint(true);
    }
  }, [isOpen, messages.length]);

  // Show input hint when a user focuses the input and has no messages
  useEffect(() => {
    if (isOpen && messages.length === 0 && !localStorage.getItem('inputHintShown') && input === '') {
      setShowInputHint(true);
    }
  }, [isOpen, messages.length, input]);

  const dismissChatHint = () => {
    setShowChatHint(false);
    localStorage.setItem('chatHintShown', 'true');
  };

  const dismissInputHint = () => {
    setShowInputHint(false);
    localStorage.setItem('inputHintShown', 'true');
  };

  useEffect(() => {
    if (panelRef.current) {
      panelRef.current.style.width = `${width}px`;
      onWidthChange(width);
    }
  }, [width, onWidthChange]);

  // Auto-focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      
      // Also scroll to bottom when panel opens
      if (messagesEndRef.current && !userIsScrolling) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [isOpen, userIsScrolling]);

  // This effect runs when messages change to scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current && !userIsScrolling) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, userIsScrolling]);

  // Handle manual scrolling
  useEffect(() => {
    const messagesContainer = messagesContainerRef.current;
    if (!messagesContainer) return;
    
    const handleScroll = () => {
      // If user scrolls up, mark as manually scrolling
      if (messagesContainer.scrollHeight - messagesContainer.scrollTop > 
          messagesContainer.clientHeight + 50) {
        setUserIsScrolling(true);
      } else {
        setUserIsScrolling(false);
      }
    };
    
    messagesContainer.addEventListener('scroll', handleScroll);
    return () => messagesContainer.removeEventListener('scroll', handleScroll);
  }, []);

  // Global document click handler to force blur the input for ALL users
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      // Skip if the click is inside the chat panel
      if (panelRef.current?.contains(e.target as Node)) {
        return;
      }
      
      // Force blur by directly manipulating the DOM
      if (document.activeElement === inputRef.current) {
        // Use timeout to ensure event queue processes properly
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.blur();
            // Move focus to body
            document.body.focus();
          }
        }, 1);
      }
    };

    // Use capture phase for event to ensure it runs before others
    document.addEventListener('mousedown', handleDocumentClick, true);
    
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick, true);
    };
  }, []);

  useEffect(() => {
    // Previously had auto-scrolling behavior for loading state
  }, [isLoading]);

  // Add event listener for login dialog
  useEffect(() => {
    const handleOpenLoginDialog = () => {
      // Only show signup popup if this is a guest user that has already used their free generation
      if (!user && freeGenerationUsed) {
        setShowSignupPopup(true);
      }
    };

    window.addEventListener('open-login-dialog', handleOpenLoginDialog);
    
    return () => {
      window.removeEventListener('open-login-dialog', handleOpenLoginDialog);
    };
  }, [user, freeGenerationUsed, setShowSignupPopup]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setStartX(e.clientX);
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();

    requestAnimationFrame(() => {
      const newWidth = width + (e.clientX - startX);
      const minWidth = 280;
      const maxWidth = window.innerWidth * 0.4;

      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setWidth(newWidth);
        setStartX(e.clientX);
      }
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isDragging, startX, width]);

  if (!isOpen) return null;

  return (
    <>
      {isDragging && (
        <div 
          className="fixed inset-0 z-50 cursor-col-resize"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        />
      )}

      <div
        ref={panelRef}
        className="fixed top-[104px] bottom-0 left-0 bg-gradient-to-br from-[#F5F7FA] to-[#BFD4DF]/40 border-r border-gray-200/50 shadow-lg select-none overflow-hidden z-40"
        style={{ 
          width: `${width}px`,
          willChange: 'width',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden'
        }}
      >
        <div
          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400 hover:opacity-30 transition-colors" 
          onMouseDown={handleMouseDown}
        />
        <div className="flex flex-col h-full">
          <ChatHeader onClose={onClose} />
          
          <div 
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto px-4 pt-1 pb-4 space-y-3 chat-font overflow-x-hidden -mt-1" 
            style={{ 
              overscrollBehavior: 'contain',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {showChatHint && messages.length === 0 && (
              <div className="mt-3 mx-auto">
                <ColorHint onClose={dismissChatHint} />
              </div>
            )}
            
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "assistant" ? "justify-start" : "justify-end"
                } items-start gap-2 max-w-[85%] ${
                  message.role === "assistant" ? "ml-2" : "ml-auto mr-2"
                } ${index === 0 ? "-mt-2" : ""}`}
              >
                <div
                  className={`rounded-2xl p-3 ${
                    message.role === "assistant"
                      ? "bg-white/80 backdrop-blur-sm text-gray-800 shadow-sm"
                      : "bg-[#2C2C2C] backdrop-blur-sm text-white shadow-sm"
                  } transition-all duration-200 hover:shadow-md`}
                >
                  {message.role === "assistant" ? (
                    formatMessage(message.content)
                  ) : (
                    message.content
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-3 ml-2 shadow-sm">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400/80 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                    <div className="w-2 h-2 bg-gray-400/80 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-gray-400/80 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="p-4 border-t border-gray-200/50 relative">
            {showInputHint && messages.length === 0 && (
              <div className="absolute bottom-[60px] right-14 z-10 w-[200px]">
                <div className="p-3 bg-gradient-to-r from-blue-50/95 to-pink-50/95 rounded-lg shadow-md border border-blue-100 speech-bubble-bottom">
                  <button 
                    onClick={dismissInputHint}
                    className="absolute top-1 right-1 p-1 text-gray-400 hover:text-gray-600"
                  >
                    <X size={14} />
                  </button>
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">Tip:</span> Try typing "Suggest a palette with blue tones" to get started.
                  </p>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={!user && hasReceivedFirstResponse ? "Sign in to create more color palettes..." : "Type your color request here..."}
                className="flex-1 bg-white/70 border-gray-200/70 focus:border-gray-300/50 focus:ring-gray-300/20 transition-all duration-200 rounded-xl placeholder:text-gray-400 placeholder:italic chat-font"
                tabIndex={0}
                style={{ outline: 'none' }}
                autoFocus={false}
              />
              <Button 
                type="submit" 
                disabled={isLoading || (!user && hasReceivedFirstResponse)}
                className="bg-[#2C2C2C] hover:bg-[#3C3C3C] transition-all duration-200 shadow-sm hover:shadow-md rounded-xl text-white"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};
