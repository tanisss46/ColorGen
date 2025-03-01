
import React from 'react';
import { Bot, User, Terminal } from "lucide-react";
import { Message } from '@/types/chat';

interface MessageListProps {
  messages: Message[];
  isOpen: boolean;
  isLoading: boolean;
  formatMessage: (content: string) => React.ReactNode;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

export const MessageList = ({ messages, isOpen, isLoading, formatMessage, messagesEndRef }: MessageListProps) => {
  return (
    <div 
      className={`flex-1 overflow-y-auto transition-all duration-300 bg-gray-100 ${isOpen ? 'h-[500px]' : 'h-[100px]'}`}
      style={{ resize: 'vertical', minHeight: '100px', maxHeight: '80vh' }}
    >
      <div className="px-2 py-1">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`mb-2 transition-all duration-300 ${
              isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
            }`}
            style={{ transitionDelay: `${index * 50}ms` }}
          >
            <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} items-start`}>
              {message.role !== 'user' && (
                <div className="w-6 h-6 rounded-full bg-white/50 flex items-center justify-center flex-shrink-0 -mb-6 z-10 relative left-2">
                  {message.role === 'system' ? (
                    <Terminal className="w-3 h-3 text-gray-500" />
                  ) : (
                    <Bot className="w-3 h-3 text-gray-500" />
                  )}
                </div>
              )}
              <div 
                className={`relative message-content max-w-[85%] text-sm py-2 px-3 ${
                  message.role === 'user' 
                    ? 'bg-[#E5F4FF] text-gray-800 rounded-t-2xl rounded-l-2xl rounded-br-sm' 
                    : 'bg-white text-gray-800 rounded-t-2xl rounded-r-2xl rounded-bl-sm'
                }`}
              >
                {formatMessage(message.content)}
              </div>
              {message.role === 'user' && (
                <div className="w-6 h-6 rounded-full bg-white/50 flex items-center justify-center flex-shrink-0 -mb-6 z-10 relative right-2">
                  <User className="w-3 h-3 text-gray-500" />
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start gap-2 px-2">
            <div className="w-6 h-6 rounded-full bg-white/50 flex items-center justify-center">
              <Bot className="w-3 h-3 text-gray-400 animate-pulse" />
            </div>
            <div className="bg-white rounded-t-2xl rounded-r-2xl rounded-bl-sm py-2 px-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-2" />
      </div>
    </div>
  );
};
