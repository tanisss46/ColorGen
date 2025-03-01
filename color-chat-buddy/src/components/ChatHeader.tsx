import React from 'react';
import { MessageSquare, X } from "lucide-react";

interface ChatHeaderProps {
  onClose: () => void;
  isAuthenticated?: boolean;
  messageCount?: number;
  className?: string;
}

export const ChatHeader = ({ onClose, className = '' }: ChatHeaderProps) => {
  return (
    <div className={`h-14 px-4 flex items-center justify-between bg-transparent relative z-50 ${className}`}>
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-black/10 backdrop-blur-sm flex items-center justify-center">
          <MessageSquare className="w-4 h-4 text-gray-700" />
        </div>
        <span className="font-medium text-gray-700">AI Color Assistant</span>
      </div>
      <button
        onClick={onClose}
        className="p-1 hover:bg-black/5 rounded-full transition-colors"
      >
        <X className="w-4 h-4 text-gray-500" />
      </button>
    </div>
  );
};
