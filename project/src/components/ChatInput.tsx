import React from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ value, onChange, onSend, disabled }) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) {
        onSend();
      }
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Send a message..."
              disabled={disabled}
              className="w-full resize-none rounded-lg border border-gray-300 p-3 pr-12 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
              rows={1}
              style={{
                minHeight: '44px',
                maxHeight: '120px',
                height: 'auto',
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = target.scrollHeight + 'px';
              }}
            />
          </div>
          <button
            onClick={onSend}
            disabled={disabled || !value.trim()}
            className="flex-shrink-0 bg-gradient-to-r from-orange-600 to-green-600 hover:from-orange-700 hover:to-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-3 rounded-lg transition-colors shadow-lg"
            title="Send message"
          >
            <Send size={18} />
          </button>
        </div>
        <div className="text-xs text-gray-500 mt-2 text-center">
          Press Enter to send, Shift + Enter for new line
        </div>
      </div>
    </div>
  );
};