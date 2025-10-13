import React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatHeader } from './ChatHeader';
import { ChatMessage } from './ChatMessage';
import { TypingIndicator } from './TypingIndicator';
import { ChatInput } from './ChatInput';
import { AuthModal } from './AuthModal';
import { useChat } from '../hooks/useChat';

export const ChatContainer: React.FC = () => {
  const navigate = useNavigate();
  const {
    messages,
    isLoading,
    currentInput,
    error,
    sendMessage,
    copyMessage,
    setCurrentInput,
    setApiKey,
    messagesEndRef,
  } = useChat();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('authToken');
  });

  const handleAuthSuccess = (_token: string, apiKey?: string) => {
    setIsAuthenticated(true);
    if (apiKey) {
      setApiKey(apiKey);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setApiKey('');
    // Navigate to register page after logout
    navigate('/register');
  };
  return (
    <>
      <div className="flex flex-col h-screen bg-white">
        <ChatHeader 
          onApiKeyClick={() => {}}
          onAuthClick={() => isAuthenticated ? handleLogout() : setShowAuthModal(true)}
          isAuthenticated={isAuthenticated}
          hasApiKey={true}
        />
      
        <div className="flex-1 overflow-y-auto">
          
          {!isAuthenticated && (
            <div className="bg-gradient-to-r from-orange-50 to-green-50 border-l-4 border-orange-400 p-6 mx-4 mt-4 rounded-r-lg">
              <div className="flex">
                <div className="ml-3 flex-1">
                  <div className="text-orange-800">
                    <h3 className="text-lg font-semibold mb-2">🇮🇳 Welcome to Bharat AI!</h3>
                    <p className="text-sm mb-3">
                      Get started with intelligent conversations powered by OpenAI. Sign in to begin your AI journey.
                    </p>
                    <div className="mt-2">
                      <button
                        onClick={() => setShowAuthModal(true)}
                        className="bg-gradient-to-r from-orange-500 to-green-500 hover:from-orange-600 hover:to-green-600 text-white px-6 py-2 rounded-lg text-sm transition-colors font-medium shadow-sm"
                      >
                        🚀 Get Started Now
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-4 mt-4">
              <div className="flex">
                <div className="ml-3">
                  <div className="text-sm text-red-700">
                    <strong>Error:</strong> {error}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="max-w-4xl mx-auto">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                onCopy={copyMessage}
              />
            ))}
          
            {isLoading && <TypingIndicator />}
          
            <div ref={messagesEndRef} />
          </div>
        </div>
      
        <ChatInput
          value={currentInput}
          onChange={setCurrentInput}
          onSend={() => sendMessage(currentInput)}
          disabled={isLoading || !isAuthenticated}
        />
      </div>
      
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </>
  );
};