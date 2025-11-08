import React, { useState, useEffect } from "react";
import { Mail, Shield, ArrowRight, Sparkles, Zap } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChatGPTInterface } from "./ChatGPTInterface";
import { BaseUrl } from "../config/config.js";
import { GoogleLogin } from "@react-oauth/google";

export const AuthPage = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("authToken")
  );

  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Handle token from redirect (if your backend redirects with token)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      localStorage.setItem("authToken", token);
      navigate("/chatgpt");
    }
  }, [navigate]);

  // ✅ Redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      setIsAuthenticated(true);
    } else if (location.pathname === "/") {
      navigate("/login");
    }
  }, [navigate, location.pathname]);

  const handleInputChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // ✅ Email/Password Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`${BaseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setIsAuthenticated(true);
        navigate("/chatgpt");
      } else {
        setError(data.message || "Invalid credentials");
      }
    } catch (err) {
      console.error(err);
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Google Login Handler
  const handleGoogleLogin = async (credentialResponse) => {
    setError("");
    try {
      const res = await fetch(`${BaseUrl}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        navigate("/chatgpt");
      } else {
        setError(data.message || "Google sign-in failed");
      }
    } catch (err) {
      console.error(err);
      setError("Network error during Google sign-in");
    }
  };

  const handleRegister = () => navigate("/register");

  if (isAuthenticated) return <ChatGPTInterface />;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white">
      <div className="w-full max-w-md space-y-8">
        {/* Logo Section */}
        <div className="text-center">
          <div className="relative inline-block mb-4">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-orange-500 via-white to-green-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-orange-200/30">
              <img
                src="/download.jpg"
                alt="Bharat AI - India"
                className="w-16 h-16 object-cover rounded-full"
              />
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

          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 via-blue-600 to-green-600 bg-clip-text text-transparent">
            Bharat AI
          </h1>
          <p className="text-gray-600">Your Intelligent Assistant</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/90 rounded-2xl shadow-2xl border border-gray-200 p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <div>
              <label className="block text-gray-800 font-semibold mb-2">
                Gmail Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl text-gray-800 focus:ring-2 focus:ring-orange-500"
                  placeholder="your.email@gmail.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-800 font-semibold mb-2">
                Password
              </label>
              <div className="relative">
                <Shield className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl text-gray-800 focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-orange-600 via-blue-600 to-green-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:scale-105 transition-all"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Shield size={18} /> Login <ArrowRight size={18} />
                </>
              )}
            </button>

            {/* ✅ Google Login */}
            <div className="flex flex-col items-center gap-4 mt-6">
              <GoogleLogin
                onSuccess={handleGoogleLogin}
                onError={() => setError("Google login failed")}
                useOneTap
                theme="outline"
                size="large"
                shape="rectangular"
              />
            </div>

            {/* Register Button */}
            <button
              type="button"
              onClick={handleRegister}
              className="w-full mt-4 bg-gradient-to-r from-green-600 via-blue-600 to-orange-600 text-white py-3 rounded-xl font-semibold hover:scale-105 transition-all"
            >
              Register Now
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-400 text-sm">
          Secure • Fast • Intelligent
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
