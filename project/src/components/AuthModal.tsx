import React, { useState } from 'react';
import { X, Mail, Phone, User, Shield, Clock } from 'lucide-react';
import {BaseUrl} from '../config/config.js';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (token: string, apiKey?: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [step, setStep] = useState<'contact' | 'otp'>('contact');
  const [contactType, setContactType] = useState<'email' | 'mobile'>('email');
  const [formData, setFormData] = useState({
    contact: '',
    name: '',
    otp: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);

  if (!isOpen) return null;

  const startOtpTimer = () => {
    setOtpTimer(300); // 5 minutes
    const interval = setInterval(() => {
      setOtpTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${BaseUrl}/api/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.contact
        })
      });

      const data = await response.json();

      if (response.ok) {
        setStep('otp');
        startOtpTimer();
      } else {
        setError(data.error || 'Failed to send OTP');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${BaseUrl}/api/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.contact,
          password: formData.name, // Using name field as password for now
          otp: formData.otp
        })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onAuthSuccess(data.token, data.apiKey);
        onClose();
        // Reset form
        setStep('contact');
        setFormData({ contact: '', name: '', otp: '' });
      } else {
        setError(data.error || 'OTP verification failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleResendOtp = () => {
    if (otpTimer === 0) {
      handleSendOtp(new Event('submit') as any);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {step === 'contact' ? 'Sign In / Sign Up' : 'Verify OTP'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {step === 'contact' ? (
          <form onSubmit={handleSendOtp} className="p-6 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Method
              </label>
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setContactType('email')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg border transition-colors ${
                    contactType === 'email'
                      ? 'bg-purple-50 border-purple-500 text-purple-700'
                      : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Mail size={16} />
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => setContactType('mobile')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg border transition-colors ${
                    contactType === 'mobile'
                      ? 'bg-purple-50 border-purple-500 text-purple-700'
                      : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Phone size={16} />
                  Mobile
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {contactType === 'email' ? 'Email Address' : 'Mobile Number'}
              </label>
              <div className="relative">
                {contactType === 'email' ? (
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                ) : (
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                )}
                <input
                  type={contactType === 'email' ? 'email' : 'tel'}
                  name="contact"
                  value={formData.contact}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder={contactType === 'email' ? 'Enter your email' : 'Enter your mobile number'}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Enter your full name"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Shield size={18} />
                  Send OTP
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="p-6 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="bg-purple-50 border border-purple-200 text-purple-700 px-4 py-3 rounded">
              <div className="flex items-center gap-2">
                <Shield size={16} />
                <span className="text-sm">
                  OTP sent to {formData.contact}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter OTP
              </label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  name="otp"
                  value={formData.otp}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-center text-lg tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                  required
                />
              </div>
            </div>

            {otpTimer > 0 && (
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <Clock size={14} />
                <span>Resend OTP in {formatTime(otpTimer)}</span>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={otpTimer > 0 || isLoading}
                className="flex-1 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 text-gray-700 py-2 px-4 rounded-lg transition-colors"
              >
                Resend OTP
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Shield size={18} />
                    Verify
                  </>
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setStep('contact');
                setError('');
                setOtpTimer(0);
              }}
              className="w-full text-purple-500 hover:text-purple-600 text-sm transition-colors"
            >
              ← Back to contact details
            </button>
          </form>
        )}
      </div>
    </div>
  );
};