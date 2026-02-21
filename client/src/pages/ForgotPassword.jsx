import { useState } from "react";
import toast from "react-hot-toast";
import { useAuthContext } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import { MailIcon } from "lucide-react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const { forgotPassword } = useAuthContext();
  const navigate = useNavigate();

  const handleInputChange = (value) => {
    setEmail(value);
    if (errors.email) setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setErrors({ email: "Email is required" }); return; }
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      setErrors({ email: "Enter a valid email address" }); return;
    }
    setSubmitting(true);
    try {
      const data = await forgotPassword({ email });
      if (data.success) {
        toast.success(data.message || "OTP sent if email exists");
        navigate("/reset-password", { state: { email } });
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
            <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Email Address</label>
            <div className="relative">
              <input
                type="email"
                className={`input-field pr-10 ${errors.email ? "border-red-500" : ""}`}
                value={email}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="Enter your registered email"
                required
              />
              <MailIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
            </div>
            {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
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
