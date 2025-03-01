import { useState } from 'react';
import { X } from 'lucide-react';

interface ColorHintProps {
  onClose: () => void;
}

export const ColorHint = ({ onClose }: ColorHintProps) => {
  const [isVisible, setIsVisible] = useState(true);
  
  // No auto-dismiss - stay visible until closed manually
  
  const handleClose = () => {
    setIsVisible(false);
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="relative w-full max-w-[250px] mx-auto fadeIn">
      <div className="p-3 bg-gradient-to-r from-blue-50/95 to-pink-50/95 rounded-lg shadow-md border border-blue-100 speech-bubble">
        <button 
          onClick={handleClose}
          className="absolute top-1 right-1 p-1 text-gray-400 hover:text-gray-600"
        >
          <X size={16} />
        </button>
        
        <div className="flex items-start gap-2 pb-2">
          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-pink-500 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          
          <div>
            <h3 className="font-medium text-sm text-gray-800">Need help with colors?</h3>
            <p className="text-xs text-gray-600 mt-1">
              Ask the AI Assistant for palette suggestions, color advice, and <span className="text-pink-500 font-medium">instantly preview</span> them!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
