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
    <div className="min-h-screen flex items-center justify-center px-4 py-20 pt-24" style={{ backgroundColor: "var(--bg-primary)" }}>
      <div className="w-full max-w-md card p-6 sm:p-8">
        <h2 className="text-xl sm:text-2xl font-semibold mb-6" style={{ color: "var(--text-primary)" }}>Reset Password</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className="input-field"
              required
              title="Enter the email address where OTP was sent"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>OTP Code</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={otp}
                onChange={(e) => handleInputChange("otp", e.target.value)}
                className="input-field flex-1"
                placeholder="Enter 6-digit OTP"
                required
                maxLength={6}
                title="Enter the 6-digit OTP sent to your email"
              />
              <button
                type="button"
                onClick={handleResend}
                className="btn-secondary px-3 py-2 text-sm flex-shrink-0"
                title="Resend OTP to your email"
              >
                Resend
              </button>
            </div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>OTP expires in 2 minutes</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => handleInputChange("newPassword", e.target.value)}
              className="input-field"
              placeholder="Create a strong password"
              required
              title="Password must be at least 8 characters with uppercase, lowercase, numbers, and special characters"
            />
            {newPassword && (
              <div className="text-xs flex flex-wrap gap-x-3 gap-y-1" style={{ color: "var(--text-muted)" }}>
                <span>Strength: <span className={passwordStrength.color}>{passwordStrength.text}</span></span>
                <span className={newPassword.length >= 8 ? "text-green-500" : ""}>8+</span>
                <span className={/[A-Z]/.test(newPassword) ? "text-green-500" : ""}>A-Z</span>
                <span className={/[a-z]/.test(newPassword) ? "text-green-500" : ""}>a-z</span>
                <span className={/\d/.test(newPassword) ? "text-green-500" : ""}>0-9</span>
                <span className={/[@$!%*?&]/.test(newPassword) ? "text-green-500" : ""}>@$!</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
              className={`input-field ${confirmPassword && !passwordsMatch ? "border-red-500" : confirmPassword && passwordsMatch ? "border-green-500" : ""}`}
              placeholder="Re-enter your new password"
              required
              title="Re-enter your new password to confirm"
            />
            {confirmPassword && !passwordsMatch && (
              <p className="text-xs text-red-500">Passwords do not match</p>
            )}
            {confirmPassword && passwordsMatch && isSameAsOldPassword && (
              <p className="text-xs text-red-500">New password must be different from current password</p>
            )}
            {confirmPassword && passwordsMatch && !isSameAsOldPassword && (
              <p className="text-xs text-green-500">Passwords match</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !passwordsMatch || passwordStrength.score < 3 || isSameAsOldPassword}
            className="btn-primary w-full py-3 text-sm mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
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
