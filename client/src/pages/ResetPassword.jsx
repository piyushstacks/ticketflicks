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
    } catch (err) {
      toast.error("Something went wrong");
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
    } catch (err) {
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20 bg-gradient-to-br from-black via-[#050816] to-black">
      <div className="w-full max-w-md bg-white/5 p-8 rounded-xl border border-white/10">
        <h2 className="text-white text-2xl mb-6">Reset Password</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-white/80">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-black/40 text-white border border-white/20"
              required
            />
          </div>

          <div>
            <label className="text-sm text-white/80">OTP (2 minutes to expire)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={otp}
                onChange={(e) => handleInputChange("otp", e.target.value)}
                className="flex-1 px-3 py-2 rounded-md bg-black/40 text-white border border-white/20"
                placeholder="123456"
                required
              />
              <button
                type="button"
                onClick={handleResend}
                className="px-3 py-2 bg-white/10 text-white rounded-md hover:bg-white/20 text-sm"
              >
                Resend
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm text-white/80">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => handleInputChange("newPassword", e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-black/40 text-white border border-white/20"
              placeholder="Min 8 chars, 1 upper, 1 lower, 1 digit, 1 special"
              required
            />
            <div className="mt-1 text-xs">
              <p>
                Strength:{" "}
                <span className={passwordStrength.color}>
                  {passwordStrength.text}
                </span>
              </p>
              <p className="text-white/60 mt-1">
                ✓ 8+ characters {newPassword.length >= 8 ? "✓" : ""}
                {"\n"}
                ✓ Uppercase {/[A-Z]/.test(newPassword) ? "✓" : ""}
                {"\n"}
                ✓ Lowercase {/[a-z]/.test(newPassword) ? "✓" : ""}
                {"\n"}
                ✓ Number {/\d/.test(newPassword) ? "✓" : ""}
                {"\n"}
               ✓ Special char (@$!%*?&) {/[@$!%*?&]/.test(newPassword) ? "✓" : ""}
              </p>
            </div>
          </div>

          <div>
            <label className="text-sm text-white/80">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
              className={`w-full px-3 py-2 rounded-md bg-black/40 text-white border ${
                confirmPassword && !passwordsMatch
                  ? "border-red-500"
                  : confirmPassword && passwordsMatch
                  ? "border-green-500"
                  : "border-white/20"
              }`}
              placeholder="Re-enter password"
              required
            />
            {confirmPassword && !passwordsMatch && (
              <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
            )}
            {confirmPassword && passwordsMatch && isSameAsOldPassword && (
              <p className="text-xs text-red-400 mt-1">New password must be different from current password</p>
            )}
            {confirmPassword && passwordsMatch && !isSameAsOldPassword && (
              <p className="text-xs text-green-400 mt-1">Passwords match ✓</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !passwordsMatch || passwordStrength.score < 3 || isSameAsOldPassword}
            className="w-full py-2 bg-primary text-black rounded-md font-medium disabled:opacity-50"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
