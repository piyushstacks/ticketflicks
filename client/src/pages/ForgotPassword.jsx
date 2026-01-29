import { useState } from "react";
import toast from "react-hot-toast";
import { useAuthContext } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const { forgotPassword } = useAuthContext();
  const navigate = useNavigate();

  const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  const handleInputChange = (value) => {
    setEmail(value);
    // Clear error when user starts typing
    if (errors.email) {
      setErrors({});
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate email
    if (!email.trim()) {
      setErrors({ email: "Email is required" });
      return;
    }
    
    if (!validateEmail(email)) {
      setErrors({ email: "Enter a valid email address (e.g., user@example.com)" });
      return;
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
      toast.error(error.response?.data?.message || "Unable to send reset instructions. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20 bg-gradient-to-br from-black via-[#050816] to-black">
      <div className="w-full max-w-md rounded-3xl bg-gradient-to-br from-primary/40 via-white/5 to-black/40 border border-white/10 backdrop-blur-xl p-8 shadow-2xl">
        <h1 className="text-white text-2xl font-semibold mb-2 text-center">
          Forgot password
        </h1>
        <p className="text-white/70 text-sm mb-8 text-center">
          Enter your email address and we&apos;ll help you reset your password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm text-white/80 font-medium">Email Address</label>
            <div className="relative group">
              <input
                type="email"
                className={`w-full px-4 py-3 bg-white/5 rounded-full text-white border border-white/15 focus:outline-none focus:border-primary/80 transition-all duration-200 hover:bg-white/10 ${
                  errors.email ? 'border-red-500' : ''
                }`}
                value={email}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="Enter your registered email address"
                required
                title="Enter the email address associated with your account"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60 group-hover:text-primary transition-colors duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                  <path d="m22 7-10 5L2 7"></path>
                </svg>
              </div>
            </div>
            {errors.email && (
              <p className="text-xs text-red-400 mt-1 animate-pulse">{errors.email}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 text-base bg-white text-black font-medium rounded-full hover:bg-white/90 active:scale-95 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-white/20"
            title={submitting ? "Sending reset instructions..." : "Send password reset instructions to your email"}
          >
            {submitting ? "Submitting..." : "Send Reset Instructions"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;

