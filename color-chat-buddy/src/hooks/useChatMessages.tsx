import { useState, useRef, useEffect } from "react";
import { createChatCompletion } from "@/api/chat";
import React from 'react';
import { useAuth } from "@/hooks/useAuth";

interface Message {
  role: "assistant" | "user";
  content: string;
}

interface ChatHistoryItem {
  user: string;
  ai: string;
  timestamp: number;
  palette?: string[];
}

export function useChatMessages(
  onFilterColors: (colors: string[]) => void
) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasReceivedFirstResponse, setHasReceivedFirstResponse] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showSignupPopup, setShowSignupPopup] = useState(false);
  const [freeGenerationUsed, setFreeGenerationUsed] = useState<boolean>(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Function to check and clean expired messages
  const checkAndClearChat = () => {
    const now = Date.now();
    const chatHistory = JSON.parse(localStorage.getItem('chatHistory') || '[]') as ChatHistoryItem[];
    const cleanedHistory = chatHistory.filter(msg => now - msg.timestamp < 86400000);
    
    if (cleanedHistory.length < chatHistory.length) {
      if (cleanedHistory.length === 0) {
        localStorage.removeItem('chatHistory');
        setMessages([]);
        if (!user) {
          setHasReceivedFirstResponse(false);
          setFreeGenerationUsed(false);
        }
      } else {
        localStorage.setItem('chatHistory', JSON.stringify(cleanedHistory));
        // Convert cleaned history to messages format
        const newMessages: Message[] = [];
        cleanedHistory.forEach(item => {
          newMessages.push({ role: 'user', content: item.user });
          newMessages.push({ role: 'assistant', content: item.ai });
        });
        setMessages(newMessages);
      }
    }
  };

  // Load chat history when component mounts
  useEffect(() => {
    const chatHistory = JSON.parse(localStorage.getItem('chatHistory') || '[]') as ChatHistoryItem[];
    if (chatHistory.length > 0) {
      const newMessages: Message[] = [];
      chatHistory.forEach(item => {
        newMessages.push({ role: 'user', content: item.user });
        newMessages.push({ role: 'assistant', content: item.ai });
      });
      setMessages(newMessages);
      
      // Artık son paletin otomatik yüklenmesini istemiyoruz
      // if (chatHistory[chatHistory.length - 1].palette) {
      //   onFilterColors(chatHistory[chatHistory.length - 1].palette!);
      // }
      
      setHasReceivedFirstResponse(true);
      setFreeGenerationUsed(true);
    }
    checkAndClearChat();
  }, []);

  // Check for expired messages on load and every hour
  useEffect(() => {
    checkAndClearChat();
    const interval = setInterval(checkAndClearChat, 3600000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    // Remove auto-scrolling behavior
    // Previously had messagesEndRef.current.scrollIntoView()
  }, [messages]);

  // Reset login prompt when user logs in
  useEffect(() => {
    if (user) {
      setShowLoginPrompt(false);
    }
  }, [user]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!input.trim() || isLoading) return;

    // If user has already received first response and is not logged in, show login dialog
    if (!user && hasReceivedFirstResponse) {
      window.dispatchEvent(new CustomEvent('open-login-dialog'));
      return;
    }

    const userMessage = input.trim();
    setInput("");
    
    // Add user message to chat
    const messageWithColors = {
      role: "user" as const,
      content: userMessage
    };

    // Update messages immediately so user sees their message right away
    setMessages(prevMessages => [...prevMessages, messageWithColors]);
    
    setIsLoading(true);

    try {
      console.log('Sending message:', messageWithColors);
      
      // Determine if this is a guest user's first message
      const isFirstGuestMessage = !user && !hasReceivedFirstResponse;
      
      const response = await createChatCompletion(
        [...messages, messageWithColors], // Use messages here, not newMessages
        isFirstGuestMessage
      );
      
      console.log('Received response:', response);

      if (response.response) {
        // Add assistant's response to messages
        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: response.response 
        }]);

        // Update color filters if colors were suggested
        if (response.colors && response.colors.length > 0) {
          console.log('Updating colors:', response.colors);
          onFilterColors(response.colors);
        }

        // Save to chat history (for both guest and logged-in users)
        const chatHistory = JSON.parse(localStorage.getItem('chatHistory') || '[]') as ChatHistoryItem[];
        chatHistory.push({ 
          user: userMessage, 
          ai: response.response, 
          timestamp: Date.now(),
          palette: response.colors || [] 
        });
        localStorage.setItem('chatHistory', JSON.stringify(chatHistory));

        // Handle guest user first message
        if (!user && !hasReceivedFirstResponse) {
          setHasReceivedFirstResponse(true);
          setFreeGenerationUsed(true);
          
          // Short delay to ensure the message is shown before dialog
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('open-login-dialog'));
          }, 500);
        }
      }
    } catch (error) {
      console.error('Error in chat:', error);
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "I encountered an error. Please try again." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      handleSubmit();
    }
    
    if (e.key === " ") {
      e.stopPropagation();
    }
  };

  const dismissPopup = () => {
    setShowSignupPopup(false);
  };

  const formatMessage = (content: string): React.ReactNode => {
    return content.split('\n').map((line, index) => {
      const colorMatch = line.match(/#[0-9A-Fa-f]{6}/);
      if (colorMatch) {
        const colorCode = colorMatch[0];
        return (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: colorCode }}
            />
            <span>{line}</span>
          </div>
        );
      }
      return <div key={index}>{line}</div>;
    });
  };

  return {
    messages,
    input,
    setInput,
    isLoading,
    handleSubmit,
    handleKeyDown,
    messagesEndRef,
    formatMessage,
    showLoginPrompt,
    setShowLoginPrompt,
    showSignupPopup,
    setShowSignupPopup,
    dismissPopup,
    isGuestLimited: !user && freeGenerationUsed,
    hasReceivedFirstResponse,
    freeGenerationUsed
  };
}
