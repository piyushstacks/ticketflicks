import React, { useMemo, useState } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import { useFormValidation } from "../hooks/useFormValidation.js";
import { composeValidators, email as emailValidator, errorId, matchesField, notSameAs, passwordStrong, required } from "../lib/validation.js";

const ChangePasswordModal = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const formId = "change-password-modal";
  const schema = useMemo(
    () => ({
      email: emailValidator("Email"),
      currentPassword: required("Current password"),
      newPassword: composeValidators(
        passwordStrong("New password"),
        notSameAs("currentPassword", "New password", "current password")
      ),
      confirmPassword: composeValidators(required("Confirm new password"), matchesField("newPassword", "Passwords must match")),
    }),
    []
  );

  const { values, errors, touched, getInputProps, validateForm, reset } = useFormValidation({
    formId,
    initialValues: { email: "", currentPassword: "", newPassword: "", confirmPassword: "" },
    schema,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { isValid } = validateForm();
    if (!isValid) return;

    setLoading(true);
    try {
      console.log("[ChangePasswordModal] Attempting password change for email:", values.email);
      // Use public endpoint (no auth required)
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.email,
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
          confirmPassword: values.confirmPassword,
        }),
      });
      const contentType = response.headers.get("content-type") || "";
      const rawText = await response.text();
      const result = rawText && contentType.includes("application/json")
        ? JSON.parse(rawText)
        : {
            success: false,
            message: rawText || `Request failed (${response.status})`,
          };
      if (!response.ok && result.success !== true) {
        throw new Error(result.message || `Request failed (${response.status})`);
      }
      console.log("[ChangePasswordModal] API response:", result);
      if (result.success) {
        toast.success("Password changed successfully");
        onClose();
        reset({ email: "", currentPassword: "", newPassword: "", confirmPassword: "" });
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
              <label className="text-sm font-medium" htmlFor={`${formId}-email`} style={{ color: "var(--text-secondary)" }}>Email</label>
              <input
                {...getInputProps("email")}
                type="email"
                placeholder="you@example.com"
                className="input-field"
                required
              />
              {touched.email && errors.email && <p id={errorId(formId, "email")} className="field-error-text" role="alert">{errors.email}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" htmlFor={`${formId}-currentPassword`} style={{ color: "var(--text-secondary)" }}>Current Password</label>
              <input
                type="password"
                {...getInputProps("currentPassword")}
                placeholder="Enter current password"
                className="input-field"
                required
              />
              {touched.currentPassword && errors.currentPassword && <p id={errorId(formId, "currentPassword")} className="field-error-text" role="alert">{errors.currentPassword}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" htmlFor={`${formId}-newPassword`} style={{ color: "var(--text-secondary)" }}>New Password</label>
              <input
                type="password"
                {...getInputProps("newPassword")}
                placeholder="Enter new password"
                className="input-field"
                required
                minLength={8}
              />
              {touched.newPassword && errors.newPassword && <p id={errorId(formId, "newPassword")} className="field-error-text" role="alert">{errors.newPassword}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" htmlFor={`${formId}-confirmPassword`} style={{ color: "var(--text-secondary)" }}>Confirm New Password</label>
              <input
                type="password"
                {...getInputProps("confirmPassword")}
                placeholder="Confirm new password"
                className="input-field"
                required
                minLength={8}
              />
              {touched.confirmPassword && errors.confirmPassword && <p id={errorId(formId, "confirmPassword")} className="field-error-text" role="alert">{errors.confirmPassword}</p>}
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
