import React, { useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BaseUrl } from "../config/config";

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    otp: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1 = registration, 2 = OTP entry
  // removed unused otpSent state

  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ SEND OTP with timeout to avoid hanging UI on slow networks
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const { email, password, confirmPassword } = formData;

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(`${BaseUrl}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        signal: controller.signal,
      });

      const data = await res.json();
      clearTimeout(timeoutId);

      if (res.ok) {
        setSuccess("✅ OTP sent to your email! Please check your inbox.");
        setStep(2);
      } else {
        setError(data.message || "Failed to send OTP");
      }
    } catch (err: any) {
      console.error("Send OTP error:", err);
      if (err?.name === "AbortError") {
        setError("Request timed out. Please try again.");
      } else {
        setError("Network error. Please check your connection and try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ VERIFY OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const { email, password, otp } = formData;

    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`${BaseUrl}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, otp }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess("🎉 Registration successful! Redirecting to login...");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setError(data.error || data.message || "Invalid OTP");
      }
    } catch (err) {
      console.error("Verify OTP error:", err);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ RESEND OTP
  const handleResendOtp = async () => {
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const res = await fetch(`${BaseUrl}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess("✅ New OTP sent to your email!");
      } else {
        setError(data.message || "Failed to resend OTP");
      }
    } catch (err) {
      console.error("Resend OTP error:", err);
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white relative overflow-hidden">
      <div className="relative z-10 w-full max-w-md bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-purple-200/30 p-8">
        <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-orange-600 via-blue-600 to-green-600 bg-clip-text text-transparent mb-6">
          {step === 1 ? "Create Account" : "Verify OTP"}
        </h2>

        <form
          onSubmit={step === 1 ? handleSendOtp : handleVerifyOtp}
          className="space-y-6"
        >
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              {success}
            </div>
          )}

          {step === 1 ? (
            <>
              <div>
                <label className="block text-gray-800 font-semibold mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full border rounded-xl p-3"
                />
              </div>

              <div>
                <label className="block text-gray-800 font-semibold mb-2">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="w-full border rounded-xl p-3"
                />
              </div>

              <div>
                <label className="block text-gray-800 font-semibold mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  className="w-full border rounded-xl p-3"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-gray-800 font-semibold mb-2">
                  Enter OTP
                </label>
                <input
                  type="text"
                  name="otp"
                  value={formData.otp}
                  onChange={handleInputChange}
                  required
                  className="w-full border rounded-xl p-3 tracking-widest text-center text-lg"
                  maxLength={6}
                  placeholder="000000"
                  pattern="[0-9]{6}"
                />
              </div>

              <div className="mt-3 text-center">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isLoading}
                  className="text-blue-600 hover:text-blue-800 text-sm underline disabled:opacity-50"
                >
                  {isLoading ? "Sending..." : "Resend OTP"}
                </button>
              </div>
            </>
          )}

          <div className="space-y-3">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-orange-600 via-blue-600 to-green-600 text-white py-3 rounded-xl hover:scale-105 transition-all font-semibold disabled:opacity-50"
            >
              {isLoading
                ? "Processing..."
                : step === 1
                ? "Send OTP"
                : "Verify & Register"}
            </button>

            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={isLoading}
                className="w-full text-gray-600 hover:text-gray-800 py-2 text-sm underline disabled:opacity-50"
              >
                ← Back to Registration
              </button>
            )}

            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-gray-600 text-sm">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="text-blue-600 hover:text-blue-800 font-semibold underline"
                >
                  Login here
                </button>
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
