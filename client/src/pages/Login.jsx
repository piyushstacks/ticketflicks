import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { AlertCircle, EyeIcon, EyeOffIcon, LockIcon, UserIcon } from "lucide-react";
import { useAuthContext } from "../context/AuthContext.jsx";
import ChangePasswordModal from "../components/ChangePasswordModal.jsx";
import { useFormValidation } from "../hooks/useFormValidation.js";
import { email as emailValidator, errorId, required } from "../lib/validation.js";

const Login = () => {
  const { login } = useAuthContext();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const next = new URLSearchParams(location.search).get("next") || "/";

  const formId = "login";
  const schema = useMemo(
    () => ({
      email: emailValidator("Email"),
      password: required("Password"),
    }),
    []
  );

  const { values, errors, touched, getInputProps, validateForm, setFieldValue } = useFormValidation({
    formId,
    initialValues: { email: "", password: "", rememberMe: false },
    schema,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { isValid } = validateForm();
    if (!isValid) return;
    setLoading(true);
    try {
      const data = await login({ email: values.email, password: values.password }, { remember: values.rememberMe });
      if (!data.success) {
        toast.error(data.message || "Invalid credentials");
      } else {
        // Direct login - no OTP required. Navigate to home or next page.
        toast.success("Login successful!");
        navigate(next);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to log in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20 pt-24" style={{ backgroundColor: "var(--bg-primary)" }}>
      <div className="w-full max-w-4xl flex flex-col md:flex-row gap-10 md:gap-16 items-center">
        <div className="max-md:text-center md:flex-1 space-y-4">
          <h1 className="text-3xl md:text-4xl font-semibold" style={{ color: "var(--text-primary)" }}>
            Welcome back
          </h1>
          <p style={{ color: "var(--text-secondary)" }}>
            Sign in to manage bookings, save your favorites, and enjoy a
            seamless TicketFlicks experience.
          </p>
        </div>

        <div className="md:flex-1 max-w-md w-full rounded-2xl p-8" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <h2 className="text-2xl font-semibold mb-8 text-center" style={{ color: "var(--text-primary)" }}>
            Login
          </h2>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor={`${formId}-email`} style={{ color: "var(--text-secondary)" }}>Email Address</label>
              <div className="relative group">
                <input
                  {...getInputProps("email")}
                  type="email"
                  className="input-field pr-10"
                  placeholder="Enter your email address"
                  required
                  autoComplete="email"
                  title="Enter your registered email address"
                />
                {touched.email && errors.email ? (
                  <AlertCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#ef4444" }} />
                ) : (
                  <UserIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
                )}
              </div>
              {touched.email && errors.email && (
                <p id={errorId(formId, "email")} className="field-error-text mt-1" role="alert">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor={`${formId}-password`} style={{ color: "var(--text-secondary)" }}>Password</label>
              <div className="relative group">
                <input
                  {...getInputProps("password")}
                  type={showPassword ? "text" : "password"}
                  className="input-field pr-16"
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  title="Enter your account password"
                />
                <LockIcon className="absolute right-9 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors duration-200"
                  style={{ color: "var(--text-muted)" }}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </button>
              </div>
              {touched.password && errors.password && (
                <p id={errorId(formId, "password")} className="field-error-text mt-1" role="alert">{errors.password}</p>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="accent-accent w-3.5 h-3.5 rounded"
                  checked={values.rememberMe}
                  onChange={(e) => setFieldValue("rememberMe", e.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <div className="flex gap-3 text-xs">
                <button
                  type="button"
                  className="text-accent hover:underline"
                  onClick={() => setShowChangePasswordModal(true)}
                >
                  Change password
                </button>
                <button
                  type="button"
                  className="text-accent hover:underline"
                  onClick={() => navigate("/forgot-password")}
                >
                  Forgot password?
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
            {"Don't have an account? "}
            <Link to="/signup" className="text-accent font-medium hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
      <ChangePasswordModal isOpen={showChangePasswordModal} onClose={() => setShowChangePasswordModal(false)} />
    </div>
  );
};

export default Login;
