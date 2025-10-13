import React, { useState, useEffect } from 'react';
import { Mail, Shield, ArrowRight, Sparkles, Zap } from 'lucide-react';
import { ChatGPTInterface } from './ChatGPTInterface';
import { useNavigate, useLocation } from "react-router-dom";
import { BaseUrl } from '../config/config.js';

export const AuthPage: React.FC = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('authToken'));

  const navigate = useNavigate();
  const location = useLocation();

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    if (token && user) {
      setIsAuthenticated(true);
    } else if (location.pathname === '/') {
      navigate('/register');
    }
  }, [navigate, location.pathname]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

 const handleLogin = async (e) => {
  e.preventDefault();
  setIsLoading(true);
  setError('');

  try {
    const response = await fetch(`${BaseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: formData.email,
        password: formData.password
      }),
    });

    let data;
    try {
      data = await response.json();
      console.log("Login response:", data);
    } catch {
      setError('Server error: Unexpected response from server');
      setIsLoading(false);
      return;
    }

    if (response.ok) {
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setIsAuthenticated(true);
      navigate('/chatgpt');
    } else {
      setError(data.message || 'Invalid credentials');
    }
  } catch (err) {
    console.error(err);
    setError('Network error. Please try again.');
  } finally {
    setIsLoading(false);
  }
};

  const handleRegister = () => navigate('/register');

  if (isAuthenticated) return <ChatGPTInterface />;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-white">
      {/* --- Keep your UI as is --- */}
      <div className="relative z-10 w-full max-w-md">
        {/* Branding and Logo */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-orange-500 via-white to-green-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-orange-200/30 backdrop-blur-sm">
              <img src="/download.jpg" alt="Bharath AI - India" className="w-16 h-16 object-cover rounded-full" />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-orange-400 to-green-500 rounded-full animate-bounce border-2 border-white shadow-lg">
                <Sparkles className="w-3 h-3 text-white m-auto mt-0.5" />
              </div>
            </div>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
              <div className="bg-gradient-to-r from-orange-600 to-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                <Zap className="w-3 h-3 inline mr-1" /> AI Powered
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 via-blue-600 to-green-600 bg-clip-text text-transparent mb-2">Bharat AI</h1>
          <p className="text-gray-700 text-lg font-medium">Your Intelligent Assistant</p>
          <p className="text-gray-500 text-sm mt-2">Secure Gmail authentication</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-purple-200/30 p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">{error}</div>}

            <div>
              <label className="block text-gray-800 font-semibold mb-3">Gmail Authentication</label>
              <div className="bg-gradient-to-r from-orange-100 to-green-100 border-2 border-orange-400 rounded-xl p-4">
                <div className="flex items-center justify-center gap-2 text-orange-700">
                  <Mail size={20} />
                  <span className="font-medium">Gmail Verification</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-gray-800 font-semibold mb-2">Gmail Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-4 py-4 bg-white border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300"
                  placeholder="your.email@gmail.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-800 font-semibold mb-2">Password</label>
              <div className="relative">
                <Shield className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-4 py-4 bg-white border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-orange-600 via-blue-600 to-green-600 hover:from-orange-700 hover:via-blue-700 hover:to-green-700 disabled:opacity-50 text-white py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 font-semibold text-lg shadow-2xl hover:shadow-orange-500/25 hover:scale-105 transform"
            >
              {isLoading ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" /> :
              <> <Shield size={20} /> Login <ArrowRight size={20} /> </>}
            </button>

            <button
              type="button"
              onClick={handleRegister}
              className="w-full mt-4 bg-gradient-to-r from-green-600 via-blue-600 to-orange-600 hover:from-green-700 hover:via-blue-700 hover:to-orange-700 text-white py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 font-semibold text-lg shadow-2xl hover:shadow-green-500/25 hover:scale-105 transform"
            >
              Register Now
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-400 text-sm">Secure • Fast • Intelligent</p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
