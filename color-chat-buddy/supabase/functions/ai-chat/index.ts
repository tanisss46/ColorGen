import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import OpenAI from 'https://esm.sh/openai@4.28.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Get the assistant ID from environment variables instead of hardcoding
const ASSISTANT_ID = Deno.env.get('OPENAI_ASSISTANT_ID');

// Create a fetch wrapper with the v2 header
const fetchWithV2Header = (url: string, options: RequestInit = {}): Promise<Response> => {
  const headers = new Headers(options.headers || {});
  headers.set('OpenAI-Beta', 'assistants=v2');
  
  return fetch(url, {
    ...options,
    headers,
  });
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Check if the assistant ID is available
    if (!ASSISTANT_ID) {
      console.error('OPENAI_ASSISTANT_ID environment variable is not set');
      throw new Error('OPENAI_ASSISTANT_ID environment variable is not set');
    }

    // Check if OpenAI API key is available
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      console.error('OPENAI_API_KEY environment variable is not set');
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }

    console.log('Starting AI chat function...');
    const { messages, isGuestUser } = await req.json()
    const lastMessage = messages[messages.length - 1];
    console.log('Received message:', lastMessage.content.substring(0, 50) + '...');

    // Configure OpenAI with a custom fetch function that adds the v2 header
    console.log('Initializing OpenAI client with version 4.28.0...');
    const openai = new OpenAI({
      apiKey: apiKey,
      defaultHeaders: {
        'OpenAI-Beta': 'assistants=v2',
      },
      fetch: fetchWithV2Header,
    });

    try {
      // Create a thread
      console.log('Creating thread with v2 header...');
      const thread = await openai.beta.threads.create();
      console.log('Thread created:', thread.id);

      // Add the user's message to the thread
      console.log('Adding message to thread...');
      await openai.beta.threads.messages.create(thread.id, {
        role: "user",
        content: lastMessage.content
      });

      // Run the assistant
      console.log('Running assistant with ID:', ASSISTANT_ID);
      const run = await openai.beta.threads.runs.create(thread.id, {
        assistant_id: ASSISTANT_ID
      });
      console.log('Run created:', run.id);

      // Wait for the run to complete
      console.log('Waiting for run to complete...');
      let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      while (runStatus.status !== 'completed') {
        console.log('Run status:', runStatus.status);
        await new Promise(resolve => setTimeout(resolve, 1000));
        runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
        
        if (runStatus.status === 'failed') {
          console.error('Assistant run failed. Error:', runStatus.last_error);
          throw new Error(`Assistant run failed: ${runStatus.last_error?.message || 'Unknown error'}`);
        }
      }

      // Get the assistant's response
      console.log('Getting assistant response...');
      const messages_list = await openai.beta.threads.messages.list(thread.id);
      const assistantMessage = messages_list.data[0];
      
      if (!assistantMessage || !assistantMessage.content || assistantMessage.content.length === 0) {
        throw new Error('No response received from assistant');
      }
      
      const responseContent = assistantMessage.content[0];
      if (responseContent.type !== 'text') {
        throw new Error(`Unexpected response type: ${responseContent.type}`);
      }
      
      const response = responseContent.text.value;
      console.log('Received response:', response.substring(0, 50) + '...');

      // Extract hex colors from the response
      const colorRegex = /#[0-9A-Fa-f]{6}/g;
      const colors = response.match(colorRegex) || [];
      console.log('Extracted colors:', colors);

      // Add note for guest users about their free generation
      let finalResponse = response;
      if (isGuestUser) {
        finalResponse += '\n\nGreat! I hope you like this color palette! This is your free generation as a guest user. Sign up to create more amazing palettes!';
      }

      console.log('Function completed successfully');
      return new Response(
        JSON.stringify({
          response: finalResponse,
          colors,
          threadId: thread.id,
          runId: run.id
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      )
    } catch (openaiError) {
      console.error('OpenAI API error:', openaiError);
      throw new Error(`OpenAI API error: ${openaiError.message}`);
    }
  } catch (error) {
    console.error('Error in AI chat function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        errorType: error.constructor.name,
        stack: error.stack
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  }
})
