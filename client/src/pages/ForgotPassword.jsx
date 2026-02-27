import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useAuthContext } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import { AlertCircle, MailIcon } from "lucide-react";
import { useFormValidation } from "../hooks/useFormValidation.js";
import { email as emailValidator, errorId } from "../lib/validation.js";

const ForgotPassword = () => {
  const [submitting, setSubmitting] = useState(false);
  const { forgotPassword } = useAuthContext();
  const navigate = useNavigate();

  const formId = "forgot-password";
  const schema = useMemo(() => ({ email: emailValidator("Email") }), []);
  const { values, errors, touched, getInputProps, validateForm } = useFormValidation({
    formId,
    initialValues: { email: "" },
    schema,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { isValid } = validateForm();
    if (!isValid) return;
    setSubmitting(true);
    try {
      const data = await forgotPassword({ email: values.email });
      if (data.success) {
        toast.success(data.message || "OTP sent if email exists");
        navigate("/reset-password", { state: { email: values.email } });
      } else {
        toast.error(data.message || "Unable to process request");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to send reset instructions.");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20 pt-24" style={{ backgroundColor: "var(--bg-primary)" }}>
      <div className="w-full max-w-md rounded-2xl p-8" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <h1 className="text-2xl font-semibold mb-2 text-center" style={{ color: "var(--text-primary)" }}>
          Forgot password
        </h1>
        <p className="text-sm mb-8 text-center" style={{ color: "var(--text-muted)" }}>
          {"Enter your email and we'll help you reset your password."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor={`${formId}-email`} style={{ color: "var(--text-secondary)" }}>Email Address</label>
            <div className="relative">
              <input
                {...getInputProps("email")}
                type="email"
                className="input-field pr-10"
                placeholder="Enter your registered email"
                required
              />
              {touched.email && errors.email ? (
                <AlertCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#ef4444" }} />
              ) : (
                <MailIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
              )}
            </div>
            {touched.email && errors.email && <p id={errorId(formId, "email")} className="field-error-text">{errors.email}</p>}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Submitting..." : "Send Reset Instructions"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
