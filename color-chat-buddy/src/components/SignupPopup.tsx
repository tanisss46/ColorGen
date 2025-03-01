import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type SignupPopupProps = {
  isOpen: boolean;
  onClose: () => void;
};

const SignupPopup = ({ isOpen, onClose }: SignupPopupProps) => {
  const { setIsLoginOpen } = useAuth();

  useEffect(() => {
    if (isOpen) {
      // Record when popup was dismissed to avoid showing too frequently
      const lastDismissed = localStorage.getItem('popupDismissed');
      const now = Date.now();
      
      if (lastDismissed && (now - parseInt(lastDismissed) < 86400000)) {
        // Don't show popup if it was dismissed less than 24 hours ago
        onClose();
      }
    }
  }, [isOpen, onClose]);

  const handleDismiss = () => {
    localStorage.setItem('popupDismissed', Date.now().toString());
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleDismiss();
      }}
    >
      <div 
        className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full m-4 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>
        
        <h3 className="text-xl font-bold mb-4 text-center text-gray-800">
          Create More Color Palettes!
        </h3>
        
        <p className="text-gray-600 mb-6 text-center">
          To create more color palettes, please sign in or create a new account. It only takes a minute to sign up for free!
        </p>
        
        <div className="flex flex-col gap-4">
          <button
            onClick={() => {
              setIsLoginOpen(true);
              onClose();
            }}
            className="py-2.5 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 font-medium"
          >
            Sign Up Now
          </button>
          
          <button
            onClick={handleDismiss}
            className="py-2.5 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignupPopup;
