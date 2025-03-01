import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface WelcomeModalProps {
  onClose: () => void;
}

export const WelcomeModal = ({ onClose }: WelcomeModalProps) => {
  const [open, setOpen] = useState(false);

  // Only show on first entry
  useEffect(() => {
    // Only show if 'welcomeShown' is not in localStorage
    if (!localStorage.getItem('welcomeShown')) {
      setOpen(true);
      localStorage.setItem('welcomeShown', 'true');
    }
  }, []);

  const handleClose = () => {
    setOpen(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent 
        className="sm:max-w-[400px] w-[360px] rounded-xl border-0 shadow-lg overflow-hidden p-0" 
        overlayClassName="bg-black/30"
      >
        <div className="bg-gradient-to-br from-white to-blue-50 p-5">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-pink-500 bg-clip-text text-transparent">Welcome to ColorGen! 🎨</DialogTitle>
            <DialogDescription className="text-base pt-2 text-gray-700">
              Try our AI assistant to create stunning color palettes!
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-3 py-3">
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-800">ColorGen AI Assistant can:</h4>
              <ul className="ml-6 space-y-1 text-sm list-disc text-gray-700">
                <li>Create custom color palettes</li>
                <li>Provide color theory insights</li>
                <li>Offer design suggestions</li>
                <li>Recommend color combinations</li>
                <li><span className="font-medium text-pink-500">Instantly preview colors</span> as you chat!</li>
              </ul>
            </div>
            
            <div className="py-2 flex items-center bg-gradient-to-r from-blue-100 to-pink-100 rounded-md p-3 mt-1">
              <div className="relative mr-3">
                <div className="h-8 w-8 rounded-full flex items-center justify-center bg-gradient-to-r from-blue-600 to-pink-500 text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
                    <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
                    <path d="M2 2l7.586 7.586"></path>
                    <circle cx="11" cy="11" r="2"></circle>
                  </svg>
                </div>
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500"></span>
                </span>
              </div>
              <p className="text-sm text-gray-700">Click this button in the top left corner to start chatting with our AI assistant.</p>
            </div>
          </div>
          
          <DialogFooter className="mt-4 flex justify-center">
            <Button onClick={handleClose} className="bg-gradient-to-r from-blue-600 to-pink-500 hover:from-blue-700 hover:to-pink-600 text-white border-0 w-full">
              Try it now!
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};
