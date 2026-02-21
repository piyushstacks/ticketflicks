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
    <div className="min-h-screen flex items-center justify-center px-4 py-20 pt-24" style={{ backgroundColor: "var(--bg-primary)" }}>
      <div className="w-full max-w-md card p-6 sm:p-8">
        <h1 className="text-xl sm:text-2xl font-semibold mb-2 text-center" style={{ color: "var(--text-primary)" }}>
          Verify your email
        </h1>
        <p className="text-sm mb-6 sm:mb-8 text-center" style={{ color: "var(--text-muted)" }}>
          We sent a 6-digit code to {email}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Email Address</label>
            <input
              type="email"
              value={email}
              disabled
              className="input-field cursor-not-allowed opacity-60"
              title="Email address used for registration"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Verification Code</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="input-field flex-1"
                placeholder="Enter 6-digit code"
                maxLength={6}
                required
                title="Enter the 6-digit verification code sent to your email"
              />
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="btn-secondary px-3 py-2 text-sm flex-shrink-0 disabled:opacity-50"
                title="Resend verification code to your email"
              >
                {resending ? "Sending..." : "Resend"}
              </button>
            </div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Code expires in 10 minutes</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            title={loading ? "Verifying your email..." : "Verify your email and create account"}
          >
            {loading ? "Verifying..." : "Verify & Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
          {"Wrong email? "}
          <button
            type="button"
            onClick={() => navigate("/signup")}
            className="text-accent font-medium hover:underline"
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
