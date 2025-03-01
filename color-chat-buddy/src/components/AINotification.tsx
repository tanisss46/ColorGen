import { useState } from 'react';
import { X } from 'lucide-react';

interface AINotificationProps {
  onClose: () => void;
}

export const AINotification = ({ onClose }: AINotificationProps) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('aiNotificationClosed', 'true');
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-[100px] left-[260px] z-50 fadeIn animate-fadeIn">
      <div className="p-2 bg-gradient-to-r from-blue-200/95 to-pink-200/95 rounded-lg shadow-md border border-purple-200 max-w-[300px]">
        <button 
          onClick={handleClose}
          className="absolute top-0 right-0 p-1 text-gray-600 hover:text-gray-800"
        >
          <X size={16} />
        </button>
        
        <div className="flex items-start gap-2 pb-1">
          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 mt-0.5 pulse-animation">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
            </svg>
          </div>
          
          <div className="pulse-text">
            <p className="text-sm text-gray-800 font-medium">New! Create special Pro palettes with AI Assistant.</p>
            <p className="text-xs text-gray-600 mt-1">
              Click the <span className="text-blue-500 font-medium">AI Assistant</span> button in the top left!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
