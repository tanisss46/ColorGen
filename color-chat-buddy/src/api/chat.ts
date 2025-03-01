import { supabase } from "@/integrations/supabase/client";

export interface ChatResponse {
  response: string;
  colors: string[];
  threadId: string;
  runId: string;
}

export const createChatCompletion = async (
  messages: any[],
  isGuestUser: boolean = false
): Promise<ChatResponse> => {
  console.log('Sending chat request with messages:', messages);
  
  try {
    const { data, error } = await supabase.functions.invoke('ai-chat', {
      body: { 
        messages: messages.map(msg => ({
          role: msg.role === "assistant" ? "assistant" : "user",
          content: msg.content
        })),
        isGuestUser
      }
    });

    if (error) {
      console.error('Supabase function error:', error);
      throw new Error(`Failed to invoke chat function: ${error.message}`);
    }

    if (!data) {
      console.error('No response data received');
      throw new Error('No response data received from chat function');
    }

    console.log('Received chat response:', data);
    
    const response: ChatResponse = {
      response: data.response || data.generatedText || "",
      colors: data.colors || data.suggestedColors || [],
      threadId: data.threadId || 'ai-chat',
      runId: data.runId || Date.now().toString()
    };

    console.log('Formatted response:', response);
    return response;

  } catch (error) {
    console.error('Chat API error:', error);
    if (error instanceof Error) {
      throw new Error(`Chat API error: ${error.message}`);
    }
    throw new Error('An unexpected error occurred while getting AI response');
  }
};
