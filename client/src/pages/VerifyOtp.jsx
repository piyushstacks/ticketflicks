import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuthContext } from "../context/AuthContext.jsx";

const VerifyOtp = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { verifyOtp } = useAuthContext();
  const { resendLogin } = useAuthContext();
  const [email, setEmail] = useState(state?.email || "");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !otp) return toast.error("Email and OTP are required");
    setLoading(true);
    try {
      const data = await verifyOtp({ email, otp }, { remember: true });
      if (!data.success) {
        toast.error(data.message || "Invalid OTP");
      } else {
        toast.success("Login successful");
        const next = state?.next || "/";
        navigate(next);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to verify OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    try {
      const data = await resendLogin({ email });
      if (data.success) {
        toast.success(data.message || "OTP resent");
        setCooldown(60); // 60s cooldown
        const iv = setInterval(() => {
          setCooldown((c) => {
            if (c <= 1) {
              clearInterval(iv);
              return 0;
            }
            return c - 1;
          });
        }, 1000);
      } else {
        toast.error(data.message || "Unable to resend OTP");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to resend OTP. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20 bg-gradient-to-br from-black via-[#050816] to-black">
      <div className="w-full max-w-md bg-white/5 p-8 rounded-xl border border-white/10">
        <h2 className="text-white text-2xl mb-6 font-semibold">Verify OTP</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-white/80 font-medium">Email Address</label>
            <div className="relative group">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-black/40 text-white border border-white/20 transition-all duration-200 hover:bg-black/30 focus:outline-none focus:border-primary/80"
                required
                title="Enter your email address"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60 group-hover:text-primary transition-colors duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                  <path d="m22 7-10 5L2 7"></path>
                </svg>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-white/80 font-medium">OTP Code</label>
            <div className="relative group">
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-black/40 text-white border border-white/20 transition-all duration-200 hover:bg-black/30 focus:outline-none focus:border-primary/80"
                placeholder="Enter 6-digit OTP"
                required
                maxLength={6}
                title="Enter the 6-digit OTP sent to your email"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60 group-hover:text-primary transition-colors duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-primary text-black rounded-md font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-primary/20"
            title={loading ? "Verifying OTP..." : "Verify your OTP to login"}
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
          <div className="mt-2 text-center">
            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0}
              className="text-sm text-white/80 hover:underline transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              title={cooldown > 0 ? `Please wait ${cooldown} seconds before resending` : "Resend OTP to your email"}
            >
              {cooldown > 0 ? `Resend OTP in ${cooldown}s` : "Resend OTP"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VerifyOtp;
