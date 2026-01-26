import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { UserIcon, PhoneIcon, LockIcon, MailIcon, EyeIcon, EyeOffIcon } from "lucide-react";
import { useAuthContext } from "../context/AuthContext.jsx";

const Signup = () => {
  const { requestSignupOtp } = useAuthContext();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const next =
    new URLSearchParams(location.search).get("next") || "/";

  // Handle input changes with error clearing
  const handleInputChange = (field, value) => {
    // Update the field value
    if (field === "email") {
      setEmail(value);
    } else if (field === "name") {
      setName(value);
    } else if (field === "phone") {
      setPhone(value);
    } else if (field === "password") {
      setPassword(value);
    } else if (field === "confirmPassword") {
      setConfirmPassword(value);
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

  const passwordStrength = getPasswordStrength(password);
  const passwordsMatch = password === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = { name: "", email: "", phone: "", password: "", confirmPassword: "" };
    if (!name.trim()) nextErrors.name = "Name is required.";
    if (!email) {
      nextErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "Enter a valid email address.";
    }
    if (!phone.trim()) {
      nextErrors.phone = "Phone number is required.";
    } else if (!/^[0-9]{10}$/.test(phone.trim())) {
      nextErrors.phone = "Enter a valid 10-digit phone number.";
    }
    if (!password) {
      nextErrors.password = "Password is required.";
    } else if (password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters.";
    } else if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password) || !/[@$!%*?&]/.test(password)) {
      nextErrors.password = "Password must include uppercase, lowercase, numbers, and special characters (@$!%*?&)";
    }
    if (!confirmPassword) {
      nextErrors.confirmPassword = "Please confirm your password.";
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }
    if (
      nextErrors.name ||
      nextErrors.email ||
      nextErrors.phone ||
      nextErrors.password ||
      nextErrors.confirmPassword
    ) {
      setErrors(nextErrors);
      return;
    }
    setErrors({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
    setLoading(true);
    try {
      // Step 1: request OTP
      const data = await requestSignupOtp({ email });
      if (!data.success) {
        toast.error(data.message || "Failed to send OTP");
        return;
      }
      toast.success("OTP sent to your email");
      // Step 2: go to verification page with form data
      navigate("/verify-email", { state: { name, email, phone, password } });
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20 bg-gradient-to-br from-black via-[#050816] to-black">
      <div className="w-full max-w-5xl flex flex-col md:flex-row gap-10 md:gap-16 items-center">
        <div className="text-white max-md:text-center md:flex-1 space-y-4">
          <h1 className="text-3xl md:text-4xl font-semibold">
            Create your account
          </h1>
          <p className="text-white/70">
            Join TicketFlicks to save favorites, manage bookings, and get
            checkout-ready in seconds.
          </p>
          <ul className="mt-4 space-y-3 text-sm text-white/80">
            <li className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10">
              Secure sign up with email
            </li>
            <li className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10">
              Access your bookings across devices
            </li>
            <li className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10">
              Personalized experience and saved favorites
            </li>
          </ul>
        </div>

        <div className="md:flex-1 max-w-md w-full rounded-3xl bg-gradient-to-br from-primary/40 via-white/5 to-black/40 border border-white/10 backdrop-blur-xl p-8 shadow-2xl">
          <h2 className="text-white text-2xl font-semibold mb-8 text-center">
            Sign Up
          </h2>

          <form className="space-y-6 text-white" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm text-white/80">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full px-4 py-3 pr-10 bg-white/5 rounded-full text-white border border-white/15 focus:outline-none focus:border-primary/80"
                  value={name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="John Doe"
                  required
                  name="name"
                  autoComplete="name"
                />
                <UserIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
              </div>
              {errors.name && (
                <p className="text-xs text-red-400 mt-1">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm text-white/80">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  className="w-full px-4 py-3 pr-10 bg-white/5 rounded-full text-white border border-white/15 focus:outline-none focus:border-primary/80"
                  value={email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="name@example.com"
                  required
                  name="email"
                  autoComplete="email"
                />
                <MailIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
              </div>
              {errors.email && (
                <p className="text-xs text-red-400 mt-1">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm text-white/80">Phone Number</label>
              <div className="relative">
                <input
                  type="tel"
                  className="w-full px-4 py-3 pr-10 bg-white/5 rounded-full text-white border border-white/15 focus:outline-none focus:border-primary/80"
                  value={phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="9876543210"
                  required
                  name="tel"
                  autoComplete="tel"
                />
                <PhoneIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
              </div>
              {errors.phone && (
                <p className="text-xs text-red-400 mt-1">{errors.phone}</p>
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
                  placeholder="Min 8 chars, 1 upper, 1 lower, 1 digit, 1 special"
                  required
                  name="new-password"
                  autoComplete="new-password"
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
              <div className="mt-1 text-xs">
                <p>
                  Strength:{" "}
                  <span className={passwordStrength.color}>
                    {passwordStrength.text}
                  </span>
                </p>
                <p className="text-white/60 mt-1">
                  <span className={password.length >= 8 ? "text-green-400" : "text-white/60"}>
                    ✓ 8+ characters
                  </span>
                  {"\n"}
                  <span className={/[A-Z]/.test(password) ? "text-green-400" : "text-white/60"}>
                    ✓ Uppercase
                  </span>
                  {"\n"}
                  <span className={/[a-z]/.test(password) ? "text-green-400" : "text-white/60"}>
                    ✓ Lowercase
                  </span>
                  {"\n"}
                  <span className={/\d/.test(password) ? "text-green-400" : "text-white/60"}>
                    ✓ Number
                  </span>
                  {"\n"}
                  <span className={/[@$!%*?&]/.test(password) ? "text-green-400" : "text-white/60"}>
                    ✓ Special char (@$!%*?&)
                  </span>
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-white/80">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className={`w-full px-4 py-3 pr-20 bg-white/5 rounded-full text-white border ${
                    confirmPassword && !passwordsMatch
                      ? "border-red-500"
                      : confirmPassword && passwordsMatch
                      ? "border-green-500"
                      : "border-white/15"
                  } focus:outline-none focus:border-primary/80`}
                  value={confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  placeholder="Re-enter password"
                  required
                  name="confirm-password"
                  autoComplete="new-password"
                />
                <LockIcon className="absolute right-10 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white focus:outline-none"
                >
                  {showConfirmPassword ? (
                    <EyeOffIcon className="w-4 h-4" />
                  ) : (
                    <EyeIcon className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-400 mt-1">{errors.confirmPassword}</p>
              )}
              {confirmPassword && !passwordsMatch && (
                <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
              )}
              {confirmPassword && passwordsMatch && (
                <p className="text-xs text-green-400 mt-1">Passwords match ✓</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !passwordsMatch || passwordStrength.score < 3}
              className="w-full py-3 text-base bg-white text-black font-medium rounded-full hover:bg-white/90 active:scale-95 transition disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Sign Up"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-white/80">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-primary font-medium hover:text-primary-dull"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
