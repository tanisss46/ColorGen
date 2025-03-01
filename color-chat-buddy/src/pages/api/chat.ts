import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ASSISTANT_ID = 'asst_bfJNdhtbw7AGaQvvJcZL7Txj';

// Hex code extraction function
function extractHexCodes(text: string): string[] {
  const hexRegex = /#[0-9A-Fa-f]{6}/g;
  const matches = text.match(hexRegex);
  return matches ? matches : [];
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages } = req.body;
    const lastMessage = messages[messages.length - 1];

    // Create a thread
    const thread = await openai.beta.threads.create();

    // Add the user's message to the thread
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: lastMessage.content
    });

    // Run the assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: ASSISTANT_ID
    });

    // Wait for the run to complete
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    while (runStatus.status !== 'completed') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      
      if (runStatus.status === 'failed') {
        throw new Error('Assistant run failed');
      }
    }

    // Get the assistant's response
    const messages_list = await openai.beta.threads.messages.list(thread.id);
    const assistantMessage = messages_list.data[0];
    const response = assistantMessage.content[0].text.value;

    // Extract hex codes from the response
    const hexCodes = extractHexCodes(response);
    
    // Ensure there are at least 5 colors
    while (hexCodes.length < 5) {
      hexCodes.push('#FFFFFF');
    }

    // Ensure there are at most 5 colors
    const colors = hexCodes.slice(0, 5).map(color => ({
      value: color.toUpperCase(),
      isLocked: false
    }));

    return res.status(200).json({
      message: response,
      colors: colors
    });

  } catch (error) {
    console.error('OpenAI API error:', error);
    return res.status(500).json({ error: 'Failed to get AI response' });
  }
};

export default handler;
