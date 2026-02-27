import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuthContext } from "../context/AuthContext.jsx";
import { useFormValidation } from "../hooks/useFormValidation.js";
import { composeValidators, email as emailValidator, errorId, matchesField, otp6, passwordStrong, required } from "../lib/validation.js";

const ResetPassword = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { email: initialEmail } = state || {};
  const [loading, setLoading] = useState(false);
  const [isSameAsOldPassword, setIsSameAsOldPassword] = useState(false);
  const { resetPassword } = useAuthContext();
  const { resendForgot } = useAuthContext();

  const formId = "reset-password";
  const schema = useMemo(
    () => ({
      email: emailValidator("Email"),
      otp: otp6("OTP code"),
      newPassword: passwordStrong("New password"),
      confirmPassword: composeValidators(required("Confirm new password"), matchesField("newPassword", "Passwords must match")),
    }),
    []
  );

  const { values, errors, touched, getInputProps, setFieldValue, validateForm } = useFormValidation({
    formId,
    initialValues: { email: initialEmail || "", otp: "", newPassword: "", confirmPassword: "" },
    schema,
  });

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

  const passwordStrength = getPasswordStrength(values.newPassword);
  const passwordsMatch = values.newPassword === values.confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { isValid } = validateForm();
    if (!isValid) return;
    if (isSameAsOldPassword) {
      return toast.error("New password must be different from current password");
    }
    
    setLoading(true);
    try {
      const data = await resetPassword({ email: values.email, otp: values.otp, newPassword: values.newPassword });
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
      const emailError = emailValidator("Email")(values.email);
      if (emailError) {
        toast.error(emailError);
        return;
      }
      const data = await resendForgot({ email: values.email });
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
            <label className="text-sm font-medium" htmlFor={`${formId}-email`} style={{ color: "var(--text-secondary)" }}>Email Address</label>
            <input
              {...getInputProps("email")}
              type="email"
              className="input-field"
              required
              title="Enter the email address where OTP was sent"
            />
            {touched.email && errors.email && <p id={errorId(formId, "email")} className="field-error-text" role="alert">{errors.email}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" htmlFor={`${formId}-otp`} style={{ color: "var(--text-secondary)" }}>OTP Code</label>
            <div className="flex gap-2">
              <input
                {...getInputProps("otp")}
                type="text"
                inputMode="numeric"
                value={values.otp}
                onChange={(e) => setFieldValue("otp", e.target.value.replace(/\D/g, ""))}
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
            {touched.otp && errors.otp && <p id={errorId(formId, "otp")} className="field-error-text" role="alert">{errors.otp}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" htmlFor={`${formId}-newPassword`} style={{ color: "var(--text-secondary)" }}>New Password</label>
            <input
              type="password"
              {...getInputProps("newPassword")}
              value={values.newPassword}
              onChange={(e) => { setIsSameAsOldPassword(false); setFieldValue("newPassword", e.target.value); }}
              className="input-field"
              placeholder="Create a strong password"
              required
              title="Password must be at least 8 characters with uppercase, lowercase, numbers, and special characters"
            />
            {touched.newPassword && errors.newPassword && <p id={errorId(formId, "newPassword")} className="field-error-text" role="alert">{errors.newPassword}</p>}
            {values.newPassword && (
              <div className="text-xs flex flex-wrap gap-x-3 gap-y-1" style={{ color: "var(--text-muted)" }}>
                <span>Strength: <span className={passwordStrength.color}>{passwordStrength.text}</span></span>
                <span className={values.newPassword.length >= 8 ? "text-green-500" : ""}>8+</span>
                <span className={/[A-Z]/.test(values.newPassword) ? "text-green-500" : ""}>A-Z</span>
                <span className={/[a-z]/.test(values.newPassword) ? "text-green-500" : ""}>a-z</span>
                <span className={/\d/.test(values.newPassword) ? "text-green-500" : ""}>0-9</span>
                <span className={/[@$!%*?&]/.test(values.newPassword) ? "text-green-500" : ""}>@$!</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" htmlFor={`${formId}-confirmPassword`} style={{ color: "var(--text-secondary)" }}>Confirm New Password</label>
            <input
              type="password"
              {...getInputProps("confirmPassword")}
              className={`input-field ${values.confirmPassword && passwordsMatch ? "border-green-500" : ""}`}
              placeholder="Re-enter your new password"
              required
              title="Re-enter your new password to confirm"
            />
            {touched.confirmPassword && errors.confirmPassword && (
              <p id={errorId(formId, "confirmPassword")} className="field-error-text" role="alert">
                {errors.confirmPassword}
              </p>
            )}
            {values.confirmPassword && passwordsMatch && isSameAsOldPassword && (
              <p className="text-xs text-red-500">New password must be different from current password</p>
            )}
            {values.confirmPassword && passwordsMatch && !isSameAsOldPassword && (
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
