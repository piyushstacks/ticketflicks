import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { UserIcon, LockIcon, EyeIcon, EyeOffIcon } from "lucide-react";
import { useAuthContext } from "../context/AuthContext.jsx";

const Login = () => {
  const { login } = useAuthContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const next = new URLSearchParams(location.search).get("next") || "/";

  // Handle input changes with error clearing
  const handleInputChange = (field, value) => {
    // Update the field value
    if (field === "email") {
      setEmail(value);
    } else if (field === "password") {
      setPassword(value);
    }
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = { email: "", password: "" };
    if (!email) {
      nextErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "Enter a valid email address.";
    }
    if (!password) {
      nextErrors.password = "Password is required.";
    }
    if (nextErrors.email || nextErrors.password) {
      setErrors(nextErrors);
      return;
    }
    setErrors({ email: "", password: "" });
    setLoading(true);
    try {
      const data = await login({ email, password }, { remember: rememberMe });
      if (!data.success) {
        toast.error(data.message || "Invalid credentials");
      } else {
        // Direct login - no OTP required. Navigate to home or next page.
        toast.success("Login successful!");
        navigate(next);
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20 bg-gradient-to-br from-black via-[#050816] to-black">
      <div className="w-full max-w-4xl flex flex-col md:flex-row gap-10 md:gap-16 items-center">
        <div className="text-white max-md:text-center md:flex-1 space-y-4">
          <h1 className="text-3xl md:text-4xl font-semibold">
            Welcome back
          </h1>
          <p className="text-white/70">
            Sign in to manage bookings, save your favorites, and enjoy a
            seamless TicketFlicks experience.
          </p>
        </div>

        <div className="md:flex-1 max-w-md w-full rounded-3xl bg-gradient-to-br from-primary/40 via-white/5 to-black/40 border border-white/10 backdrop-blur-xl p-8 shadow-2xl">
          <h2 className="text-white text-2xl font-semibold mb-8 text-center">
            Login
          </h2>

          <form className="space-y-6 text-white" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm text-white/80">Email</label>
              <div className="relative">
                <input
                  type="email"
                  className="w-full px-4 py-3 pr-10 bg-white/5 rounded-full text-white border border-white/15 focus:outline-none focus:border-primary/80"
                  value={email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Enter your email"
                  required
                  name="email"
                  autoComplete="email"
                />
                <UserIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
              </div>
              {errors.email && (
                <p className="text-xs text-red-400 mt-1">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm text-white/80">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full px-4 py-3 pr-20 bg-white/5 rounded-full text-white border border-white/15 focus:outline-none focus:border-primary/80"
                  value={password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  placeholder="Enter your password"
                  required
                  name="password"
                  autoComplete="current-password"
                />
                <LockIcon className="absolute right-10 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOffIcon className="w-4 h-4" />
                  ) : (
                    <EyeIcon className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-400 mt-1">{errors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-between text-sm text-white/80">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="accent-primary"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <button
                type="button"
                className="text-primary hover:underline hover:underline-offset-4"
                onClick={() => navigate("/forgot-password")}
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-base bg-white text-black font-medium rounded-full hover:bg-white/90 active:scale-95 transition disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-white/80">
            Don&apos;t have an account?{" "}
            <Link
              to="/signup"
              className="text-primary font-medium hover:text-primary-dull"
            >
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
