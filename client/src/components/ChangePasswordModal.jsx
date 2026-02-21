import React, { useState } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";

// Validation helpers
const validateEmail = (email) => {
  if (!email) return "Email is required";
  if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
    return "Enter a valid email address";
  }
  return "";
};

const validatePassword = (password) => {
  if (!password) return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password)) {
    return "Password must contain at least 1 uppercase, 1 lowercase, 1 digit, and 1 special character (@$!%*?&)";
  }
  return "";
};

const ChangePasswordModal = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [formData, setFormData] = useState({
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field error on typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {
      email: validateEmail(formData.email),
      currentPassword: formData.currentPassword ? "" : "Current password is required",
      newPassword: validatePassword(formData.newPassword),
      confirmPassword: formData.newPassword === formData.confirmPassword ? "" : "New passwords do not match",
    };
    setErrors(newErrors);
    return Object.values(newErrors).every((e) => !e);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      console.log("[ChangePasswordModal] Attempting password change for email:", formData.email);
      // Use public endpoint (no auth required)
      const response = await fetch("/api/auth/public/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
          confirmPassword: formData.confirmPassword,
        }),
      });
      const result = await response.json();
      console.log("[ChangePasswordModal] API response:", result);
      if (result.success) {
        toast.success("Password changed successfully");
        onClose();
        setFormData({ email: "", currentPassword: "", newPassword: "", confirmPassword: "" });
        setErrors({ email: "", currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        toast.error(result.message || "Failed to change password");
      }
    } catch (error) {
      console.error("[ChangePasswordModal] Error:", error);
      const message = error.response?.data?.message || error.message || "Something went wrong";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-lg flex items-center justify-center z-50">
        <div className="glass-card shadow-xl border border-white/10 p-8 w-full max-w-md relative animate-fade-in">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-accent transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          <h2 className="text-2xl font-bold mb-6 movie-title text-center">Change Password</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium movie-meta mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className={`w-full px-4 py-2 bg-glass border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-accent ${errors.email ? "border-red-500" : "border-white/10"}`}
                required
              />
              {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium movie-meta mb-2">Current Password</label>
              <input
                type="password"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                placeholder="Enter current password"
                className={`w-full px-4 py-2 bg-glass border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-accent ${errors.currentPassword ? "border-red-500" : "border-white/10"}`}
                required
              />
              {errors.currentPassword && <p className="text-xs text-red-400 mt-1">{errors.currentPassword}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium movie-meta mb-2">New Password</label>
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="Enter new password"
                className={`w-full px-4 py-2 bg-glass border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-accent ${errors.newPassword ? "border-red-500" : "border-white/10"}`}
                required
                minLength={8}
              />
              {errors.newPassword && <p className="text-xs text-red-400 mt-1">{errors.newPassword}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium movie-meta mb-2">Confirm New Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm new password"
                className={`w-full px-4 py-2 bg-glass border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-accent ${errors.confirmPassword ? "border-red-500" : "border-white/10"}`}
                required
                minLength={8}
              />
              {errors.confirmPassword && <p className="text-xs text-red-400 mt-1">{errors.confirmPassword}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 font-semibold rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Changing..." : "Change Password"}
            </button>
          </form>
        </div>
      </div>
  );
};

export default ChangePasswordModal;
