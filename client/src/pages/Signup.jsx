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
  const [errors, setErrors] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const next = new URLSearchParams(location.search).get("next") || "/";

  const handleInputChange = (field, value) => {
    const setters = { email: setEmail, name: setName, phone: setPhone, password: setPassword, confirmPassword: setConfirmPassword };
    setters[field]?.(value);
    if (errors[field]) setErrors((prev) => { const u = { ...prev }; delete u[field]; return u; });
  };

  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, text: "", color: "" };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[@$!%*?&]/.test(pwd)) score++;
    const map = { 1: { text: "Weak", color: "text-red-500" }, 2: { text: "Fair", color: "text-orange-500" }, 3: { text: "Good", color: "text-yellow-500" }, 4: { text: "Strong", color: "text-lime-500" }, 5: { text: "Very Strong", color: "text-green-500" } };
    return { ...map[score], score };
  };

  const validatePassword = (pwd) => {
    if (!pwd) return "Password is required";
    if (pwd.length < 8) return "Password must be at least 8 characters";
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(pwd))
      return "Must include uppercase, lowercase, digit, and special character";
    return "";
  };

  const passwordStrength = getPasswordStrength(password);
  const passwordsMatch = password === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ne = { name: "", email: "", phone: "", password: "", confirmPassword: "" };
    if (!name.trim()) ne.name = "Name is required.";
    if (!email) ne.email = "Email is required.";
    else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) ne.email = "Enter a valid email";
    if (!phone.trim()) ne.phone = "Phone number is required.";
    else if (!/^[0-9]{10}$/.test(phone.trim())) ne.phone = "Enter a valid 10-digit number.";
    if (!password) ne.password = "Password is required.";
    else { const pe = validatePassword(password); if (pe) ne.password = pe; }
    if (!confirmPassword) ne.confirmPassword = "Confirm your password.";
    else if (password !== confirmPassword) ne.confirmPassword = "Passwords do not match.";
    if (ne.name || ne.email || ne.phone || ne.password || ne.confirmPassword) { setErrors(ne); return; }
    setErrors({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
    setLoading(true);
    try {
      const data = await requestSignupOtp({ email });
      if (!data.success) { toast.error(data.message || "Failed to send OTP"); return; }
      toast.success("OTP sent to your email for verification");
      navigate("/verify-email", { state: { name, email, phone, password, purpose: "signup" } });
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong.");
    } finally { setLoading(false); }
  };

  const iconCls = "absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20 pt-24" style={{ backgroundColor: "var(--bg-primary)" }}>
      <div className="w-full max-w-5xl flex flex-col md:flex-row gap-10 md:gap-16 items-center">
        {/* Left side */}
        <div className="max-md:text-center md:flex-1 space-y-4">
          <h1 className="text-3xl md:text-4xl font-semibold" style={{ color: "var(--text-primary)" }}>Create your account</h1>
          <p style={{ color: "var(--text-secondary)" }}>Join TicketFlicks to save favorites, manage bookings, and get checkout-ready in seconds.</p>
          <ul className="mt-4 space-y-3 text-sm" style={{ color: "var(--text-secondary)" }}>
            {["Secure sign up with email", "Access your bookings across devices", "Personalized experience and saved favorites"].map((t) => (
              <li key={t} className="px-4 py-3 rounded-xl" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}>{t}</li>
            ))}
          </ul>
        </div>

        {/* Form */}
        <div className="md:flex-1 max-w-md w-full rounded-2xl p-8" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <h2 className="text-2xl font-semibold mb-6 text-center" style={{ color: "var(--text-primary)" }}>Sign Up</h2>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <FormField label="Full Name" error={errors.name}>
              <input type="text" className="input-field pr-10" value={name} onChange={(e) => handleInputChange("name", e.target.value)} placeholder="Enter your full name" required name="name" autoComplete="name" />
              <UserIcon className={iconCls} style={{ color: "var(--text-muted)" }} />
            </FormField>

            <FormField label="Email Address" error={errors.email}>
              <input type="email" className="input-field pr-10" value={email} onChange={(e) => handleInputChange("email", e.target.value)} placeholder="Enter your email" required name="email" autoComplete="email" />
              <MailIcon className={iconCls} style={{ color: "var(--text-muted)" }} />
            </FormField>

            <FormField label="Phone Number" error={errors.phone}>
              <input type="tel" className="input-field pr-10" value={phone} onChange={(e) => handleInputChange("phone", e.target.value)} placeholder="10-digit mobile number" required name="tel" autoComplete="tel" />
              <PhoneIcon className={iconCls} style={{ color: "var(--text-muted)" }} />
            </FormField>

            <FormField label="Password" error={errors.password}>
              <input type={showPassword ? "text" : "password"} className="input-field pr-16" value={password} onChange={(e) => handleInputChange("password", e.target.value)} placeholder="Create a strong password" required name="new-password" autoComplete="new-password" />
              <LockIcon className="absolute right-9 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
              <button type="button" onClick={() => setShowPassword((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }}>
                {showPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
              </button>
              {password && (
                <div className="mt-1.5 text-xs flex flex-wrap gap-x-3 gap-y-1" style={{ color: "var(--text-muted)" }}>
                  <span>Strength: <span className={passwordStrength.color}>{passwordStrength.text}</span></span>
                  <span className={password.length >= 8 ? "text-green-500" : ""}>8+</span>
                  <span className={/[A-Z]/.test(password) ? "text-green-500" : ""}>A-Z</span>
                  <span className={/[a-z]/.test(password) ? "text-green-500" : ""}>a-z</span>
                  <span className={/\d/.test(password) ? "text-green-500" : ""}>0-9</span>
                  <span className={/[@$!%*?&]/.test(password) ? "text-green-500" : ""}>@$!</span>
                </div>
              )}
            </FormField>

            <FormField label="Confirm Password" error={errors.confirmPassword}>
              <input type={showConfirmPassword ? "text" : "password"} className="input-field pr-16" value={confirmPassword} onChange={(e) => handleInputChange("confirmPassword", e.target.value)} placeholder="Re-enter password" required name="confirm-password" autoComplete="new-password" />
              <LockIcon className="absolute right-9 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
              <button type="button" onClick={() => setShowConfirmPassword((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }}>
                {showConfirmPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
              </button>
              {confirmPassword && !passwordsMatch && <p className="text-xs text-red-500 mt-1">Passwords do not match</p>}
              {confirmPassword && passwordsMatch && <p className="text-xs text-green-500 mt-1">Passwords match</p>}
            </FormField>

            <button
              type="submit"
              disabled={loading || !passwordsMatch || passwordStrength.score < 3}
              className="btn-primary w-full py-3 text-sm mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating account..." : "Sign Up"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
            {"Already have an account? "}
            <Link to="/login" className="text-accent font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

const FormField = ({ label, error, children }) => (
  <div className="space-y-1.5">
    <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>{label}</label>
    <div className="relative">{children}</div>
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);

export default Signup;
