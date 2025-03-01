import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import OpenAI from "https://esm.sh/openai@4.24.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
  'OpenAI-Beta': 'assistants=v2'
};

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages = [], assistantId } = await req.json();
    
    if (!messages.length) {
      return new Response(
        JSON.stringify({ error: "No messages provided" }),
        { headers: corsHeaders, status: 400 }
      );
    }

    const lastMessage = messages[messages.length - 1];

    if (!assistantId) {
      return new Response(
        JSON.stringify({ error: "No assistant ID provided" }),
        { headers: corsHeaders, status: 400 }
      );
    }

    // Create a thread
    const thread = await openai.beta.threads.create();
    console.log('Thread created:', thread.id);

    // Add the message to the thread
    const threadMessage = await openai.beta.threads.messages.create(
      thread.id,
      {
        role: "user",
        content: lastMessage.content
      }
    );
    console.log('Message added to thread:', threadMessage.id);

    // Run the assistant
    const run = await openai.beta.threads.runs.create(
      thread.id,
      {
        assistant_id: assistantId
      }
    );
    console.log('Run created:', run.id);

    // Poll for completion
    let runStatus = await openai.beta.threads.runs.retrieve(
      thread.id,
      run.id
    );

    let attempts = 0;
    const maxAttempts = 60; // Increase timeout to 60 seconds

    while (runStatus.status === 'in_progress' || runStatus.status === 'queued') {
      if (attempts >= maxAttempts) {
        throw new Error('Request timed out after 60 seconds');
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(
        thread.id,
        run.id
      );
      console.log('Run status:', runStatus.status);
      attempts++;
    }

    if (runStatus.status !== 'completed') {
      throw new Error(`Run failed with status: ${runStatus.status}`);
    }

    // Get the assistant's messages
    const threadMessages = await openai.beta.threads.messages.list(
      thread.id
    );

    const lastAssistantMessage = threadMessages.data
      .filter(message => message.role === 'assistant')
      .pop();

    if (!lastAssistantMessage || !lastAssistantMessage.content.length) {
      throw new Error('No assistant message found');
    }

    const response = lastAssistantMessage.content[0].text.value;

    // Extract hex codes from the response
    const colorRegex = /#[0-9A-Fa-f]{6}/gi;
    const colors = (response.match(colorRegex) || []).map(color => color.toUpperCase());

    return new Response(
      JSON.stringify({
        response,
        colors,
        threadId: thread.id,
        runId: run.id
      }),
      { headers: corsHeaders }
    );

  } catch (error: any) {
    console.error('Error in chat function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An error occurred during the chat completion',
        details: error.toString()
      }),
      { 
        headers: corsHeaders,
        status: 500
      }
    );
  }
});
