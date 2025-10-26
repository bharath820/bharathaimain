# OpenRouter API Integration Setup Guide

This guide explains how to properly configure and use the OpenRouter API integration in your Bharat AI project.

## Overview

The application has been updated to use OpenRouter API for AI-powered chat responses. The integration works as follows:

1. **Frontend** → sends user messages to **Backend API**
2. **Backend API** → forwards requests to **OpenRouter API**
3. **OpenRouter API** → processes with AI models and returns responses
4. **Backend API** → returns AI responses to **Frontend**

## Setup Instructions

### 1. Get OpenRouter API Key

1. Visit [OpenRouter.ai](https://openrouter.ai/)
2. Sign up for an account
3. Go to your dashboard and create an API key
4. Copy your API key (starts with `sk-or-`)

### 2. Configure Environment Variables

Create a `.env` file in your `backend` directory with the following content:

```env
# MongoDB Configuration
MONGO_URI=mongodb://127.0.0.1:27017/bharat-ai

# Email Configuration (for OTP)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Server Configuration
PORT=5000

# OpenRouter API Configuration (for AI chat)
OPENROUTER_API_KEY=sk-or-your-actual-openrouter-api-key-here

# Alternative OpenAI API Key (if you prefer to use OpenAI directly)
OPENAI_API_KEY=sk-your-actual-openai-api-key-here

# Stability AI Configuration (for image generation)
STABILITY_AI_KEY=sk-your-actual-stability-ai-key-here

# JWT Secret (for authentication)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

**Important:** Replace `sk-or-your-actual-openrouter-api-key-here` with your actual OpenRouter API key.

### 3. Start the Application

1. **Start Backend:**
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. **Start Frontend:**
   ```bash
   cd project
   npm install
   npm run dev
   ```

## How It Works

### Backend API Route (`/search`)

The backend now properly integrates with OpenRouter API:

- **Endpoint:** `POST http://localhost:5000/search`
- **Headers:** 
  - `Content-Type: application/json`
  - `Authorization: Bearer <user-jwt-token>`
- **Body:** 
  ```json
  {
    "messages": [
      {"role": "user", "content": "Hello, how are you?"},
      {"role": "assistant", "content": "I'm doing well, thank you!"}
    ]
  }
  ```

### Frontend Integration

The frontend has been updated to:
- Remove hardcoded OpenRouter API keys
- Use the backend API instead of direct OpenRouter calls
- Maintain proper authentication with JWT tokens
- Handle errors gracefully

### Supported Models

The integration currently uses:
- **Model:** `openai/gpt-4o-mini` (cost-effective)
- **Max Tokens:** 1000
- **Temperature:** 0.7

You can modify these settings in `backend/routes/search_route.js` if needed.

## Troubleshooting

### Common Issues

1. **"OpenRouter API key not configured" error:**
   - Ensure your `.env` file has `OPENROUTER_API_KEY` set
   - Restart your backend server after adding the API key

2. **"Invalid OpenRouter API key" error:**
   - Verify your API key is correct and starts with `sk-or-`
   - Check your OpenRouter account has sufficient credits

3. **"Rate limit exceeded" error:**
   - Wait a moment and try again
   - Consider upgrading your OpenRouter plan

4. **"Insufficient credits" error:**
   - Add credits to your OpenRouter account
   - Check your usage in the OpenRouter dashboard

### Testing the Integration

1. Start both backend and frontend servers
2. Register/login to the application
3. Send a message in the chat interface
4. Check the browser console and backend logs for any errors

### API Key Security

- Never commit your `.env` file to version control
- Keep your API keys secure and private
- Consider using environment-specific configurations for production

## Cost Considerations

OpenRouter provides access to various AI models at different price points:
- `openai/gpt-4o-mini` - Most cost-effective option
- `openai/gpt-4o` - Higher quality but more expensive
- `anthropic/claude-3-haiku` - Alternative cost-effective option

Monitor your usage in the OpenRouter dashboard to manage costs.

## Support

If you encounter any issues:
1. Check the browser console for frontend errors
2. Check the backend server logs for API errors
3. Verify your OpenRouter API key and account status
4. Ensure all environment variables are properly set


