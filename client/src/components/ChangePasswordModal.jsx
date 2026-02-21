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
      <div
        className="fixed inset-0 flex items-center justify-center z-50 px-4"
        style={{ backgroundColor: "var(--overlay)" }}
      >
        <div
          className="card p-6 sm:p-8 w-full max-w-md relative animate-fadeIn"
          style={{ boxShadow: "0 24px 64px var(--shadow-color)" }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-lg transition-all hover:bg-[var(--bg-elevated)]"
            style={{ color: "var(--text-muted)" }}
          >
            <X className="w-5 h-5" />
          </button>

          <h2
            className="text-xl sm:text-2xl font-bold mb-6 text-center"
            style={{ color: "var(--text-primary)" }}
          >
            Change Password
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className={`input-field ${errors.email ? "border-red-500" : ""}`}
                required
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Current Password</label>
              <input
                type="password"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                placeholder="Enter current password"
                className={`input-field ${errors.currentPassword ? "border-red-500" : ""}`}
                required
              />
              {errors.currentPassword && <p className="text-xs text-red-500">{errors.currentPassword}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>New Password</label>
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="Enter new password"
                className={`input-field ${errors.newPassword ? "border-red-500" : ""}`}
                required
                minLength={8}
              />
              {errors.newPassword && <p className="text-xs text-red-500">{errors.newPassword}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Confirm New Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm new password"
                className={`input-field ${errors.confirmPassword ? "border-red-500" : ""}`}
                required
                minLength={8}
              />
              {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-sm mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Changing..." : "Change Password"}
            </button>
          </form>
        </div>
      </div>
  );
};

export default ChangePasswordModal;
