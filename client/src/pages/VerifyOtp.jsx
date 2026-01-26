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
    } catch (err) {
      toast.error("Something went wrong");
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
    } catch (err) {
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md bg-white/5 p-8 rounded-xl">
        <h2 className="text-white text-2xl mb-4">Verify OTP</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-white/80">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-black/40 text-white"
              required
            />
          </div>
          <div>
            <label className="text-sm text-white/80">OTP</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-black/40 text-white"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-primary text-black rounded-md"
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
          <div className="mt-2 text-center">
            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0}
              className="text-sm text-white/80 hover:underline"
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
