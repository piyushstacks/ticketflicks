import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuthContext } from "../context/AuthContext.jsx";

const VerifyEmail = () => {
  const { completeSignup, requestSignupOtp } = useAuthContext();
  const navigate = useNavigate();
  const { state } = useLocation();
  const { name, phone, password, email } = state || {};

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
      const data = await completeSignup({ email, otp, name, phone, password });
      if (data.success) {
        toast.success("Account created successfully!");
        navigate("/");
      } else {
        toast.error(data.message || "Failed to verify OTP");
      }
    } catch (err) {
      toast.error("Something went wrong");
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
    } catch (err) {
      toast.error("Something went wrong");
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
            <label className="text-sm text-white/80">Email</label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full px-4 py-3 bg-white/5 rounded-full text-white/60 border border-white/15 cursor-not-allowed"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-white/80">OTP (10 minutes to expire)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="flex-1 px-3 py-2 rounded-md bg-black/40 text-white border border-white/20"
                placeholder="123456"
                maxLength={6}
                required
              />
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="px-3 py-2 bg-white/10 text-white rounded-md hover:bg-white/20 text-sm disabled:opacity-50"
              >
                {resending ? "Sending..." : "Resend"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-base bg-white text-black font-medium rounded-full hover:bg-white/90 active:scale-95 transition disabled:opacity-60"
          >
            {loading ? "Verifying..." : "Verify & Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-white/80">
          Wrong email?{" "}
          <button
            type="button"
            onClick={() => navigate("/signup")}
            className="text-primary font-medium hover:text-primary-dull"
          >
            Go back
          </button>
        </p>
      </div>
    </div>
  );
};

export default VerifyEmail;
