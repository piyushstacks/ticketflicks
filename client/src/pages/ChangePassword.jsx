import React, { useState } from "react";
import { useAuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const ChangePassword = () => {
  const { changePassword, logout, user } = useAuthContext();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Handle input changes with error clearing
  const handleInputChange = (field, value) => {
    // Update the field value
    if (field === "currentPassword") {
      setCurrentPassword(value);
    } else if (field === "newPassword") {
      setNewPassword(value);
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
  const passwordsDifferent = currentPassword !== newPassword;
  const isPasswordValid = newPassword.length >= 8 && 
    /[a-z]/.test(newPassword) && 
    /[A-Z]/.test(newPassword) && 
    /\d/.test(newPassword) && 
    /[@$!%*?&]/.test(newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill all fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (currentPassword === newPassword) {
      toast.error("New password must be different from current password");
      return;
    }
    if (!isPasswordValid) {
      toast.error("Password does not meet complexity requirements");
      return;
    }
    setLoading(true);
    try {
      const { data } = await changePassword({ currentPassword, newPassword, confirmPassword });
      if (data.success) {
        toast.success(data.message || "Password changed successfully");
        // force logout and redirect to login
        logout();
        navigate("/login");
      } else {
        toast.error(data.message || "Unable to change password");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-black/60 rounded-md border border-white/10">
      <h2 className="text-2xl text-white mb-4">Change Password</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm text-white/80">Current Password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => handleInputChange("currentPassword", e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-black/40 text-white border border-white/20"
            required
          />
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
              <span className={newPassword.length >= 8 ? "text-green-400" : "text-white/60"}>
                ✓ 8+ characters
              </span>
              {"\n"}
              <span className={/[A-Z]/.test(newPassword) ? "text-green-400" : "text-white/60"}>
                ✓ Uppercase
              </span>
              {"\n"}
              <span className={/[a-z]/.test(newPassword) ? "text-green-400" : "text-white/60"}>
                ✓ Lowercase
              </span>
              {"\n"}
              <span className={/\d/.test(newPassword) ? "text-green-400" : "text-white/60"}>
                ✓ Number
              </span>
              {"\n"}
              <span className={/[@$!%*?&]/.test(newPassword) ? "text-green-400" : "text-white/60"}>
                ✓ Special char (@$!%*?&)
              </span>
            </p>
          </div>
        </div>

        <div>
          <label className="text-sm text-white/80">Confirm New Password</label>
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
            required
          />
          {confirmPassword && !passwordsMatch && (
            <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
          )}
          {confirmPassword && passwordsMatch && !passwordsDifferent && (
            <p className="text-xs text-red-400 mt-1">New password must be different from current password</p>
          )}
          {confirmPassword && passwordsMatch && passwordsDifferent && (
            <p className="text-xs text-green-400 mt-1">Passwords match ✓</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={loading || !passwordsMatch || !isPasswordValid || !passwordsDifferent}
            className="px-4 py-2 bg-indigo-600 rounded-md text-white disabled:opacity-60"
          >
            {loading ? "Saving..." : "Change Password"}
          </button>
          <button
            type="button"
            className="text-sm text-white/70 hover:underline"
            onClick={() => navigate(-1)}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChangePassword;
