import React, { useState, useEffect, useRef } from 'react';
import { Key, User, CheckCircle, LogOut, Mail } from 'lucide-react';

interface ChatHeaderProps {
  onApiKeyClick: () => void;
  onAuthClick: () => void;
  isAuthenticated: boolean;
  hasApiKey: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ 
  onApiKeyClick, 
  onAuthClick, 
  isAuthenticated, 
  hasApiKey 
}) => {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const user = isAuthenticated ? JSON.parse(localStorage.getItem('user') || '{}') : null;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 via-white to-green-600 rounded-xl flex items-center justify-center shadow-lg border border-white/20">
                  <img 
                    src="/download.jpg" 
                    alt="Bharath AI - India" 
                    className="w-8 h-8 object-cover rounded-lg"
                  />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-orange-400 to-green-500 rounded-full animate-pulse border-2 border-white shadow-sm"></div>
                </div>
              </div>
              <div className="flex flex-col">
                <div className="text-xl font-bold bg-gradient-to-r from-orange-600 via-blue-600 to-green-600 bg-clip-text text-transparent">
                  Bharat AI
                </div>
              </div>
            </div>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-orange-800">Intelligent Assistant</h1>
            <p className="text-sm text-gray-500">
              {hasApiKey ? (
                <span className="flex items-center gap-1">
                  <CheckCircle size={12} className="text-green-500" />
                  OpenAI Connected
                </span>
              ) : (
                'OpenAI API Key Required'
              )}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          
          {isAuthenticated ? (
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="p-2 rounded-lg transition-colors text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                title={`Profile - ${user?.email || 'User'}`}
              >
                <User size={18} />
              </button>
              
              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-green-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Welcome!</p>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <Mail size={12} />
                          {user?.email || 'User'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      setShowProfileDropdown(false);
                      onAuthClick();
                    }}
                    className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button 
              onClick={onAuthClick}
              className="p-2 rounded-lg transition-colors text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              title="Sign In"
            >
              <User size={18} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};