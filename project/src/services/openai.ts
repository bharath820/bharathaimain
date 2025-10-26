export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export const generateChatResponse = async (messages: ChatMessage[], apiKey?: string): Promise<string> => {
  try {
    // If no API key provided, show error
    if (!apiKey || !apiKey.trim()) {
      throw new Error('OpenAI API key is required. Please add your API key to start chatting.');
    }

    // Validate API key format
    if (!apiKey.startsWith('sk-')) {
      throw new Error('Invalid OpenAI API key format. API key should start with "sk-"');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are Bharat AI, a helpful and intelligent assistant powered by OpenAI. Provide clear, concise, and helpful responses to user questions. Be friendly, professional, and informative.'
          },
          ...messages
        ],
        max_tokens: 1000,
        temperature: 0.7,
        stream: false
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      
      if (response.status === 401) {
        throw new Error('Invalid OpenAI API key. Please check your API key and try again.');
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again.');
      } else if (response.status === 402) {
        throw new Error('Insufficient credits. Please check your OpenAI account billing.');
      } else {
        throw new Error(errorData.error?.message || 'Failed to get response from OpenAI');
      }
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from OpenAI');
    }

    return data.choices[0].message.content || 'I apologize, but I was unable to generate a response. Please try again.';
  } catch (error) {
    console.error('OpenAI API Error:', error);
    
    if (error instanceof Error) {
      // Re-throw known errors
      throw error;
    }
    
    // Handle network errors
    throw new Error('Network error. Please check your internet connection and try again.');
  }
};