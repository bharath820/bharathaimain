// Test script to verify OpenRouter API integration
import { config } from './config.js';
import OpenAI from 'openai';

async function testOpenRouter() {
  console.log('🧪 Testing OpenRouter API Integration...\n');

  // Check if API key is configured
  if (!config.OPENROUTER_API_KEY) {
    console.error('❌ OPENROUTER_API_KEY not found in environment variables');
    console.log('Please create a .env file in the backend directory with:');
    console.log('OPENROUTER_API_KEY=sk-or-your-actual-api-key-here');
    process.exit(1);
  }

  if (!config.OPENROUTER_API_KEY.startsWith('sk-or-')) {
    console.error('❌ Invalid OpenRouter API key format');
    console.log('API key should start with "sk-or-"');
    process.exit(1);
  }

  console.log('✅ API key format is valid');

  try {
    // Initialize OpenRouter client
    const openai = new OpenAI({
      apiKey: config.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
    });

    console.log('📤 Sending test message to OpenRouter...');

    // Test API call
    const completion = await openai.chat.completions.create({
      model: 'openai/gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: 'Hello! This is a test message. Please respond with "API test successful!"'
        }
      ],
      max_tokens: 100,
      temperature: 0.7,
    });

    const response = completion.choices?.[0]?.message?.content;
    
    if (response) {
      console.log('✅ OpenRouter API test successful!');
      console.log('📝 Response:', response);
    } else {
      console.error('❌ No response received from OpenRouter');
    }

  } catch (error) {
    console.error('❌ OpenRouter API test failed:');
    
    if (error.response?.status === 401) {
      console.error('Invalid API key. Please check your OpenRouter API key.');
    } else if (error.response?.status === 429) {
      console.error('Rate limit exceeded. Please wait and try again.');
    } else if (error.response?.status === 402) {
      console.error('Insufficient credits. Please add credits to your OpenRouter account.');
    } else {
      console.error('Error:', error.message);
    }
    
    process.exit(1);
  }
}

testOpenRouter();
