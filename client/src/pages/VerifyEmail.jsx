import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuthContext } from "../context/AuthContext.jsx";

const VerifyEmail = () => {
  const { completeSignupWithOtp, requestSignupOtp } = useAuthContext();
  const navigate = useNavigate();
  const { state } = useLocation();
  const { name, phone, password, email, purpose } = state || {};

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  if (!email) {
    navigate("/signup");
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otp) {
      return toast.error("OTP is required");
    }
    setLoading(true);
    try {
      const data = await completeSignupWithOtp({ email, otp, name, phone, password });
      if (data.success) {
        toast.success("Account created successfully!");
        navigate("/");
      } else {
        toast.error(data.message || "Failed to create account");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const data = await requestSignupOtp({ email });
      if (data.success) {
        toast.success("OTP resent to your email");
      } else {
        toast.error(data.message || "Failed to resend OTP");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to resend OTP. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20 bg-gradient-to-br from-black via-[#050816] to-black">
      <div className="w-full max-w-md rounded-3xl bg-gradient-to-br from-primary/40 via-white/5 to-black/40 border border-white/10 backdrop-blur-xl p-8 shadow-2xl">
        <h1 className="text-white text-2xl font-semibold mb-2 text-center">
          Verify your email
        </h1>
        <p className="text-white/70 text-sm mb-8 text-center">
          We sent a 6‑digit code to {email}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm text-white/80 font-medium">Email Address</label>
            <div className="relative group">
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-4 py-3 bg-white/5 rounded-full text-white/60 border border-white/15 cursor-not-allowed transition-all duration-200"
                title="Email address used for registration"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                  <path d="m22 7-10 5L2 7"></path>
                </svg>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-white/80 font-medium">Verification Code</label>
            <div className="flex gap-2">
              <div className="relative group flex-1">
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="flex-1 px-3 py-2 rounded-md bg-black/40 text-white border border-white/20 transition-all duration-200 hover:bg-black/30 focus:outline-none focus:border-primary/80"
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  required
                  title="Enter the 6-digit verification code sent to your email"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60 group-hover:text-primary transition-colors duration-200">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </div>
              </div>
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="px-3 py-2 bg-white/10 text-white rounded-md hover:bg-white/20 text-sm transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Resend verification code to your email"
              >
                {resending ? "Sending..." : "Resend"}
              </button>
            </div>
            <p className="text-xs text-white/60">Code expires in 10 minutes</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-base bg-white text-black font-medium rounded-full hover:bg-white/90 active:scale-95 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-white/20"
            title={loading ? "Verifying your email..." : "Verify your email and create account"}
          >
            {loading ? "Verifying..." : "Verify & Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-white/80">
          Wrong email?{" "}
          <button
            type="button"
            onClick={() => navigate("/signup")}
            className="text-primary font-medium hover:text-primary-dull transition-all duration-200 hover:scale-105 active:scale-95"
            title="Go back to signup page"
          >
            Go back
          </button>
        </p>
      </div>
    </div>
  );
};

export default VerifyEmail;
