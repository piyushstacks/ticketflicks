import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuthContext } from "../context/AuthContext.jsx";

const ResetPassword = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { email: initialEmail } = state || {};
  const [email, setEmail] = useState(initialEmail || "");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSameAsOldPassword, setIsSameAsOldPassword] = useState(false);
  const { resetPassword } = useAuthContext();
  const { resendForgot } = useAuthContext();

  // Handle input changes with error clearing
  const handleInputChange = (field, value) => {
    // Update the field value
    if (field === "email") {
      setEmail(value);
    } else if (field === "otp") {
      setOtp(value);
    } else if (field === "newPassword") {
      setNewPassword(value);
      setIsSameAsOldPassword(false); // Reset flag when user types
    } else if (field === "confirmPassword") {
      setConfirmPassword(value);
    }
  };

  // Password validation helper
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, text: "", color: "text-gray-400" };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[@$!%*?&]/.test(pwd)) score++;
    
    const strengthMap = {
      1: { text: "Weak", color: "text-red-500" },
      2: { text: "Fair", color: "text-orange-500" },
      3: { text: "Good", color: "text-yellow-500" },
      4: { text: "Strong", color: "text-lime-500" },
      5: { text: "Very Strong", color: "text-green-500" },
    };
    return { ...strengthMap[score], score };
  };

  const passwordStrength = getPasswordStrength(newPassword);
  const passwordsMatch = newPassword === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !otp || !newPassword || !confirmPassword) {
      return toast.error("All fields are required");
    }
    if (!passwordsMatch) {
      return toast.error("Passwords do not match");
    }
    if (newPassword.length < 8) {
      return toast.error("Password must be at least 8 characters");
    }
    if (!/[a-z]/.test(newPassword) || !/[A-Z]/.test(newPassword) || !/\d/.test(newPassword) || !/[@$!%*?&]/.test(newPassword)) {
      return toast.error("Password must include uppercase, lowercase, numbers, and special characters (@$!%*?&)");
    }
    if (isSameAsOldPassword) {
      return toast.error("New password must be different from current password");
    }
    
    setLoading(true);
    try {
      const data = await resetPassword({ email, otp, newPassword });
      if (data.success) {
        toast.success(data.message || "Password reset successful");
        navigate("/login");
      } else {
        // Check if it's the same password error
        if (data.message === "New password must be different from current password") {
          setIsSameAsOldPassword(true);
        }
        toast.error(data.message || "Unable to reset password");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      const data = await resendForgot({ email });
      if (data.success) {
        toast.success(data.message || "OTP resent if email exists");
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
        <h2 className="text-white text-2xl mb-6">Reset Password</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-white/80 font-medium">Email Address</label>
            <div className="relative group">
              <input
                type="email"
                value={email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-black/40 text-white border border-white/20 transition-all duration-200 hover:bg-black/30 focus:outline-none focus:border-primary/80"
                required
                title="Enter the email address where OTP was sent"
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
            <div className="flex gap-2">
              <div className="relative group flex-1">
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => handleInputChange("otp", e.target.value)}
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
              <button
                type="button"
                onClick={handleResend}
                className="px-3 py-2 bg-white/10 text-white rounded-md hover:bg-white/20 text-sm transition-all duration-200 hover:scale-105 active:scale-95"
                title="Resend OTP to your email"
              >
                Resend
              </button>
            </div>
            <p className="text-xs text-white/60">OTP expires in 2 minutes</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-white/80 font-medium">New Password</label>
            <div className="relative group">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => handleInputChange("newPassword", e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-black/40 text-white border border-white/20 transition-all duration-200 hover:bg-black/30 focus:outline-none focus:border-primary/80"
                placeholder="Create a strong password"
                required
                title="Password must be at least 8 characters with uppercase, lowercase, numbers, and special characters"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60 group-hover:text-primary transition-colors duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
            </div>
            <div className="mt-1 text-xs">
              <p>
                Strength: <span className={passwordStrength.color}>{passwordStrength.text}</span>
              </p>
              <p className="text-white/60 mt-1">
                <span className={newPassword.length >= 8 ? "text-green-400" : "text-white/60"}>✓ 8+ characters</span>
                {"\n"}
                <span className={/[A-Z]/.test(newPassword) ? "text-green-400" : "text-white/60"}>✓ Uppercase</span>
                {"\n"}
                <span className={/[a-z]/.test(newPassword) ? "text-green-400" : "text-white/60"}>✓ Lowercase</span>
                {"\n"}
                <span className={/\d/.test(newPassword) ? "text-green-400" : "text-white/60"}>✓ Number</span>
                {"\n"}
                <span className={/[@$!%*?&]/.test(newPassword) ? "text-green-400" : "text-white/60"}>✓ Special char (@$!%*?&)</span>
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-white/80 font-medium">Confirm New Password</label>
            <div className="relative group">
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                className={`w-full px-3 py-2 rounded-md bg-black/40 text-white border transition-all duration-200 hover:bg-black/30 focus:outline-none focus:border-primary/80 ${
                  confirmPassword && !passwordsMatch
                    ? "border-red-500"
                    : confirmPassword && passwordsMatch
                    ? "border-green-500"
                    : "border-white/20"
                }`}
                placeholder="Re-enter your new password"
                required
                title="Re-enter your new password to confirm"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60 group-hover:text-primary transition-colors duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
            </div>
            {confirmPassword && !passwordsMatch && (
              <p className="text-xs text-red-400 mt-1 animate-pulse">Passwords do not match</p>
            )}
            {confirmPassword && passwordsMatch && isSameAsOldPassword && (
              <p className="text-xs text-red-400 mt-1 animate-pulse">New password must be different from current password</p>
            )}
            {confirmPassword && passwordsMatch && !isSameAsOldPassword && (
              <p className="text-xs text-green-400 mt-1">Passwords match ✓</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !passwordsMatch || passwordStrength.score < 3 || isSameAsOldPassword}
            className="w-full py-2 bg-primary text-black rounded-md font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-primary/20"
            title={loading ? "Resetting your password..." : "Reset your account password"}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
