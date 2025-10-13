import { useState, useCallback, useRef, useEffect } from 'react';
import { Message, ChatState } from '../types/chat';

export const useChat = (): ChatState & {
  sendMessage: (content: string) => void;
  copyMessage: (content: string) => void;
  setCurrentInput: (input: string) => void;
  setApiKey: (apiKey: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
} => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hello! I'm Bharat AI, your intelligent assistant. How can I help you today?",
      role: 'assistant',
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentInput, setCurrentInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Function to call backend search API
  const callBackendAPI = async (messages: any[]) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('Authentication required. Please log in.');
    }

    const response = await fetch('http://localhost:5000/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ messages })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get response from server');
    }

    const data = await response.json();
    return data.result;
  };

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    setError(null);
    const userMessage: Message = {
      id: Date.now().toString(),
      content: content.trim(),
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentInput('');
    setIsLoading(true);

    try {
      // Convert messages to OpenAI format
      const chatMessages = messages.concat(userMessage).map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await callBackendAPI(chatMessages);
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: response || "No response from AI",
        role: 'assistant',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      
      // Add error message to chat
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: `❌ Error: ${errorMessage}`,
        role: 'assistant',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, messages]);

  const copyMessage = useCallback(async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  }, []);

  return {
    messages,
    isLoading,
    currentInput,
    error,
    sendMessage,
    copyMessage,
    setCurrentInput,
    setApiKey,
    messagesEndRef,
  };
};