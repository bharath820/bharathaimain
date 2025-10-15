
import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Bot, Copy, LogOut, Menu, X } from 'lucide-react';
import { ChatSidebar } from './ChatSidebar';
import { Message } from '../types/chat';
import { BaseUrl } from '../config/config.js';
import { useNavigate } from 'react-router-dom'; 





interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export const ChatGPTInterface: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // API configuration - using backend API instead of direct OpenRouter calls
const navigate = useNavigate();

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
      setIsCheckingAuth(false);
      loadConversations();
    } else {
      setTimeout(() => window.location.href = '/login', 100);
    }
  }, []);

  useEffect(() => {
    if (currentConversationId) loadMessages(currentConversationId);
    else setMessages([]);
  }, [currentConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const loadConversations = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch(`${BaseUrl}/api/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const mappedConversations = data.conversations.map((conv: any) => ({
          id: conv._id,
          title: conv.title,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt
        }));
        setConversations(mappedConversations);

        if (mappedConversations.length > 0 && !currentConversationId) {
          setCurrentConversationId(mappedConversations[0].id);
        }
      } else {
        setConversations([]);
      }
    } catch (err) {
      console.error(err);
      setConversations([]);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${BaseUrl}/api/conversations/${conversationId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const mappedMessages = data.messages.map((msg: any) => ({
          id: msg._id,
          content: msg.content,
          role: msg.role,
          timestamp: new Date(msg.timestamp),
          imageUrl: msg.imageUrl,
          isImage: msg.isImage
        }));
        setMessages(mappedMessages);
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.error(err);
      setMessages([]);
    }
  };

  const createNewConversationAndReturnId = async (): Promise<string | null> => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${BaseUrl}/api/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: "New Chat" }),
      });

      if (response.ok) {
        const data = await response.json();
        loadConversations();
        return data.conversation._id;
      }
      return null;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  // **Core: send message via backend API to OpenRouter**
const sendMessage = async (content: string) => {
  if (!content.trim()) return;
  setIsLoading(true);
  setError(null);

  try {
    let convId = currentConversationId;
    if (!convId) {
      convId = await createNewConversationAndReturnId();
      if (!convId) throw new Error("Failed to create conversation");
      setCurrentConversationId(convId);
      setMessages([]);
    }

    // Detect image prompt with various formats
    const cleaned = content.trim();
    const lower = cleaned.toLowerCase();
    const isImagePrompt =
      lower.startsWith("/image") ||
      lower.startsWith("image:") ||
      lower.startsWith("generate image") ||
      lower.startsWith("create image") ||
      lower.startsWith("draw ") ||
      lower.startsWith("paint ") ||
      lower.startsWith("make image") ||
      lower.includes(" generate ") ||
      lower.includes(" create ") ||
      lower.includes(" draw ") ||
      lower.includes(" paint ");

    // Add the user message to chat history for UI
    const userMessage = {
      id: Date.now().toString(),
      content: cleaned,
      role: "user",
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setCurrentInput("");

    const token = localStorage.getItem("authToken");

    if (isImagePrompt) {
      // Remove the prompt prefix before sending to backend
      const promptText = cleaned
        .replace(/^\/image\s*/i, "")
        .replace(/^image:\s*/i, "")
        .replace(/^generate image\s*/i, "")
        .replace(/^create image\s*/i, "")
        .replace(/^draw\s+/i, "")
        .replace(/^paint\s+/i, "")
        .replace(/^make image\s*/i, "")
        .replace(/\s+(generate|create|draw|paint)\s+/gi, " ")
        .trim();

      // Send image prompt to Stability API backend route
      const response = await fetch(`${BaseUrl}/api/generate-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt: promptText, conversationId: convId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Image generation failed");
      }

      // Reload messages from backend (because assistant image message is inserted by backend)
      setTimeout(() => loadMessages(convId), 300);
      return;
    } else {
      // All other prompts (text) handled by OpenRouter
      const chatMessages = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content,
      }));
      const response = await fetch(`${BaseUrl}/api/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ messages: chatMessages, conversationId: convId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Text generation failed");
      }

      const data = await response.json();
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          content: data.result,
          role: "assistant",
          timestamp: new Date(),
        },
      ]);
      setTimeout(() => loadMessages(convId), 300);
    }
  } catch (err) {
    console.error(err);
    setError(err instanceof Error ? err.message : "Unexpected error");
  } finally {
    setIsLoading(false);
  }
};


   const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    navigate('/register'); // ✅ React Router handles this internally
  };

  return (
    <div className="flex h-screen bg-white">
      {isCheckingAuth ? (
        <div className="flex items-center justify-center w-full h-full">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Bharat AI...</h2>
            <p className="text-gray-600">Please wait while we load your data</p>
          </div>
        </div>
      ) : (
        <>
          <div className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 overflow-hidden`}>
            <ChatSidebar
              conversations={conversations}
              currentConversationId={currentConversationId}
              onNewChat={createNewConversationAndReturnId}
              onSelectConversation={setCurrentConversationId}
              onDeleteConversation={async (id) => { /* implement if needed */ }}
              onRenameConversation={async (id, title) => { /* implement if needed */ }}
              isLoading={isLoading}
            />
          </div>

          <div className="flex-1 flex flex-col">
            <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
  <div className="flex items-center gap-3">
    <button
      onClick={() => setSidebarOpen(!sidebarOpen)}
      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
    >
      {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
    </button>
    <h1 className="text-xl font-semibold text-gray-900">Bharat AI</h1>
  </div>

  <div className="flex items-center gap-3">
    {user ? (
      // If user is logged in
      <>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-green-500 rounded-full flex items-center justify-center text-white font-semibold">
            {user.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <span>{user.email}</span>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
          title="Logout"
        >
          <LogOut size={18} />
        </button>
      </>
    ) : (
      // If no user is logged in
      <>
        <button
          onClick={handleLogin} // Your login function or redirect
          className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
        >
          Login
        </button>
        <button
          onClick={handleSignup} // Your signup function or redirect
          className="px-4 py-2 text-sm text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition"
        >
          Signup
        </button>
      </>
    )}
  </div>
</header>


            <div className="flex-1 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">Welcome back, {user?.email?.split('@')[0] || 'User'}!</h2>
                    <p className="text-gray-600 mb-4">Start your first conversation with Bharat AI</p>
                    <button onClick={() => sendMessage("Hello")} className="bg-gradient-to-r from-orange-500 to-green-500 text-white px-6 py-2 rounded-lg hover:from-orange-600 hover:to-green-600 transition-colors">
                      Start Chat
                    </button>
                  </div>
                </div>
              ) : (
                <div className="max-w-4xl mx-auto">
                  {messages.map((message) => (
                    <div key={message.id} className={`flex gap-3 p-6 ${message.role === 'user' ? 'bg-white' : 'bg-gray-50'} border-b border-gray-100`}>
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-600 text-white'}`}>
                        {message.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-sm font-semibold text-gray-900 mb-2">{message.role === 'user' ? 'You' : 'Bharat AI'}</div>
                          <button onClick={() => navigator.clipboard.writeText(message.content)} className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors" title="Copy message">
                            <Copy size={14} />
                          </button>
                        </div>
                        <div className="prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap">{message.content}</div>
                        {message.isImage && message.imageUrl && (
                          <div className="mt-3">
                            <img 
                              src={message.imageUrl} 
                              alt="Generated image" 
                              className="max-w-full h-auto rounded-lg shadow-sm border border-gray-200"
                              style={{ maxHeight: '400px' }}
                            />
                          </div>
                        )}
                        <div className="text-xs text-gray-400 mt-2">{message.timestamp.toLocaleTimeString()}</div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-3 p-6 bg-gray-50 border-b border-gray-100">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-600 text-white flex items-center justify-center">
                        <Bot size={16} />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-gray-900 mb-2">Bharat AI</div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 p-4">
              <div className="max-w-4xl mx-auto">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(currentInput); } }}
                    placeholder="Ask anything... (Try 'draw a sunset' or 'generate image of a cat' for images)"
                    disabled={isLoading}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
                  />
                  <button
                    onClick={() => sendMessage(currentInput)}
                    disabled={isLoading || !currentInput.trim()}
                    className="px-4 py-3 bg-gradient-to-r from-orange-500 to-green-500 text-white rounded-lg hover:from-orange-600 hover:to-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send size={20} />
                  </button>
                </div>
                {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
