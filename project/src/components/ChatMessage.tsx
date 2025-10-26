import React from 'react';
import { Copy, User, Bot } from 'lucide-react';
import { Message } from '../types/chat';

interface ChatMessageProps {
  message: Message;
  onCopy: (content: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onCopy }) => {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex gap-3 p-6 ${isUser ? 'bg-white' : 'bg-gray-50'} border-b border-gray-100`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isUser ? 'bg-blue-500 text-white' : 'bg-gray-600 text-white'
      }`}>
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="text-sm font-semibold text-gray-900 mb-2">
            {isUser ? 'You' : 'Eagle AI'}
          </div>
          <button
            onClick={() => onCopy(message.content)}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="Copy message"
          >
            <Copy size={14} />
          </button>
        </div>
        <div className="prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap">
          {message.content}
        </div>
        {message.isImage && message.imageUrl && (
          <div className="mt-4">
            <img 
              src={message.imageUrl} 
              alt="Generated image" 
              className="max-w-full h-auto rounded-lg shadow-md border border-gray-200"
              onError={(e) => {
                console.error('Failed to load image:', message.imageUrl);
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}
        <div className="text-xs text-gray-400 mt-2">
          {message.timestamp.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};