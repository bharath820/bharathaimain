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
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ✅ Check authentication
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      setUser(JSON.parse(userData));
      setIsCheckingAuth(false);
      loadConversations();
    } else {
      setTimeout(() => navigate('/login'), 100);
    }
  }, []);

  // ✅ Load messages when a conversation is selected
  useEffect(() => {
    if (currentConversationId) loadMessages(currentConversationId);
    else setMessages([]);
  }, [currentConversationId]);

  // ✅ Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const loadConversations = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const res = await fetch(`${BaseUrl}/api/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const mapped = data.conversations.map((c: any) => ({
          id: c._id,
          title: c.title,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        }));
        setConversations(mapped);
        if (!currentConversationId && mapped.length) setCurrentConversationId(mapped[0].id);
      }
    } catch (err) {
      console.error('Load conversations error:', err);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${BaseUrl}/api/conversations/${conversationId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const mapped = data.messages.map((m: any) => ({
          id: m._id,
          content: m.content,
          role: m.role,
          timestamp: new Date(m.timestamp),
          imageUrl: m.imageUrl,
          isImage: m.isImage,
        }));
        setMessages(mapped);
      }
    } catch (err) {
      console.error('Load messages error:', err);
    }
  };

  const createNewConversationAndReturnId = async (): Promise<string | null> => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${BaseUrl}/api/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: 'New Chat' }),
      });
      if (res.ok) {
        const data = await res.json();
        loadConversations();
        return data.conversation._id;
      }
    } catch (err) {
      console.error(err);
    }
    return null;
  };

  // ✅ Send message (text or image)
  const sendMessage = async (content: string) => {
  if (!content.trim()) return;
  setIsLoading(true);
  setError(null);

  try {
    let convId = currentConversationId;
    if (!convId) {
      convId = await createNewConversationAndReturnId();
      if (!convId) throw new Error('Failed to create conversation');
      setCurrentConversationId(convId);
      setMessages([]);
    }

    const cleaned = content.trim();

    // Detect image prompt
    const isImagePrompt =
      cleaned.toLowerCase().startsWith('/image') ||
      cleaned.toLowerCase().includes('generate image') ||
      cleaned.toLowerCase().includes('draw') ||
      cleaned.toLowerCase().includes('create image');

    const token = localStorage.getItem('authToken');

    // Optimistically add user's message
    const userMessage = {
      id: Date.now().toString(),
      content: cleaned,
      role: 'user',
      timestamp: new Date(),
      isImage: false,
    };
    setMessages(prev => [...prev, userMessage]);
    setCurrentInput('');

    if (isImagePrompt) {
      // Clean prompt for image API
      const promptText = cleaned
        .replace(/^\/image\s*/i, '')
        .replace(/^generate image\s*/i, '')
        .replace(/^draw\s+/i, '')
        .replace(/^create image\s*/i, '')
        .trim();

      const res = await fetch(`${BaseUrl}/api/generate-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt: promptText, conversationId: convId }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Image generation failed');
      }

      const data = await res.json();
      setMessages(prev => [...prev, data.message]);
    } else {
      // Text generation
      const chatHistory = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch(`${BaseUrl}/api/generate-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ messages: chatHistory, conversationId: convId }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Text generation failed');
      }

      const data = await res.json();
      setMessages(prev => [...prev, data.message]);
    }
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Unexpected error');
  } finally {
    setIsLoading(false);
  }
};


  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    navigate('/register');
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
          {/* Sidebar */}
          <div className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 overflow-hidden`}>
            <ChatSidebar
              conversations={conversations}
              currentConversationId={currentConversationId}
              onNewChat={createNewConversationAndReturnId}
              onSelectConversation={setCurrentConversationId}
              isLoading={isLoading}
            />
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
                <h1 className="text-xl font-semibold text-gray-900">Bharat AI</h1>
              </div>

              <div className="flex items-center gap-3">
                {user && (
                  <>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-green-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {user.email?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <span>{user.email}</span>
                    </div>
                    <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600">
                      <LogOut size={18} />
                    </button>
                  </>
                )}
              </div>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                      Welcome back, {user?.email?.split('@')[0] || 'User'}!
                    </h2>
                    <p className="text-gray-600 mb-4">Start your first conversation with Bharat AI</p>
                    <button
                      onClick={() => sendMessage('Hello')}
                      className="bg-gradient-to-r from-orange-500 to-green-500 text-white px-6 py-2 rounded-lg hover:from-orange-600 hover:to-green-600 transition-colors"
                    >
                      Start Chat
                    </button>
                  </div>
                </div>
              ) : (
                <div className="max-w-4xl mx-auto">
                  {messages.map((m) => (
  <div
    key={m.id}
    className={`flex gap-3 p-6 ${
      m.role === "user" ? "bg-white" : "bg-gray-50"
    } border-b`}
  >
    <div
      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        m.role === "user" ? "bg-blue-500" : "bg-gray-600"
      } text-white`}
    >
      {m.role === "user" ? <User size={16} /> : <Bot size={16} />}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-start justify-between gap-2">
        <div className="text-sm font-semibold text-gray-900 mb-2">
          {m.role === "user" ? "You" : "Bharat AI"}
        </div>
        <button
          onClick={() => navigator.clipboard.writeText(m.content)}
          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
          title="Copy"
        >
          <Copy size={14} />
        </button>
      </div>

      <div className="prose prose-sm text-gray-800 whitespace-pre-wrap">
        {m.content}
      </div>

      {m.isImage && m.imageUrl && (
        <div className="mt-3 w-full">
          <img
            src={`${BaseUrl}/api/image-proxy?url=${encodeURIComponent(m.imageUrl)}`}
            alt="Generated"
            className="w-full h-auto rounded-lg shadow-lg border border-gray-300"
          />
        </div>
      )}

      <div className="text-xs text-gray-400 mt-2">
        {new Date(m.timestamp).toLocaleTimeString()}
      </div>
    </div>
  </div>
))}

                  {isLoading && (
                    <div className="flex gap-3 p-6 bg-gray-50 border-b">
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

            {/* Input */}
            <div className="border-t border-gray-200 p-4">
              <div className="max-w-4xl mx-auto">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage(currentInput);
                      }
                    }}
                    placeholder="Ask anything... (Try 'draw a cat' or 'generate image of mountains')"
                    disabled={isLoading}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                  <button
                    onClick={() => sendMessage(currentInput)}
                    disabled={isLoading || !currentInput.trim()}
                    className="px-4 py-3 bg-gradient-to-r from-orange-500 to-green-500 text-white rounded-lg hover:from-orange-600 hover:to-green-600 transition"
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
