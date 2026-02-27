import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { AlertCircle, EyeIcon, EyeOffIcon, LockIcon, MailIcon, PhoneIcon, UserIcon } from "lucide-react";
import { useAuthContext } from "../context/AuthContext.jsx";
import { useFormValidation } from "../hooks/useFormValidation.js";
import { composeValidators, email as emailValidator, errorId, matchesField, passwordStrong, phone10, required } from "../lib/validation.js";

const minName = (value) => {
  const v = (value || "").toString().trim();
  if (v.length < 2) return "Full name must be at least 2 characters";
  return "";
};

const Signup = () => {
  const { requestSignupOtp } = useAuthContext();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const formId = "signup";
  const schema = useMemo(
    () => ({
      name: composeValidators(required("Full name"), minName),
      email: emailValidator("Email"),
      phone: phone10("Phone number"),
      password: passwordStrong("Password"),
      confirmPassword: composeValidators(required("Confirm password"), matchesField("password", "Passwords must match")),
    }),
    []
  );

  const { values, errors, touched, getInputProps, validateForm } = useFormValidation({
    formId,
    initialValues: { name: "", email: "", phone: "", password: "", confirmPassword: "", rememberMe: false },
    schema,
  });

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

  const passwordStrength = getPasswordStrength(values.password);
  const passwordsMatch = values.password === values.confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { isValid } = validateForm();
    if (!isValid) return;
    setLoading(true);
    try {
      const data = await requestSignupOtp({ email: values.email });
      if (!data.success) { toast.error(data.message || "Failed to send OTP"); return; }
      toast.success("OTP sent to your email for verification");
      navigate("/verify-email", { state: { name: values.name, email: values.email, phone: values.phone, password: values.password, purpose: "signup" } });
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
            <FormField formId={formId} name="name" label="Full Name" error={touched.name ? errors.name : ""}>
              <input
                {...getInputProps("name")}
                type="text"
                className="input-field pr-10"
                placeholder="Enter your full name"
                autoComplete="name"
                required
              />
              {touched.name && errors.name ? (
                <AlertCircle className={iconCls} style={{ color: "#ef4444" }} />
              ) : (
                <UserIcon className={iconCls} style={{ color: "var(--text-muted)" }} />
              )}
            </FormField>

            <FormField formId={formId} name="email" label="Email Address" error={touched.email ? errors.email : ""}>
              <input
                {...getInputProps("email")}
                type="email"
                className="input-field pr-10"
                placeholder="Enter your email"
                autoComplete="email"
                required
              />
              {touched.email && errors.email ? (
                <AlertCircle className={iconCls} style={{ color: "#ef4444" }} />
              ) : (
                <MailIcon className={iconCls} style={{ color: "var(--text-muted)" }} />
              )}
            </FormField>

            <FormField formId={formId} name="phone" label="Phone Number" error={touched.phone ? errors.phone : ""} help="Must be 10 digits">
              <input
                {...getInputProps("phone")}
                type="tel"
                inputMode="numeric"
                className="input-field pr-10"
                placeholder="10-digit mobile number"
                autoComplete="tel"
                required
              />
              {touched.phone && errors.phone ? (
                <AlertCircle className={iconCls} style={{ color: "#ef4444" }} />
              ) : (
                <PhoneIcon className={iconCls} style={{ color: "var(--text-muted)" }} />
              )}
            </FormField>

            <FormField formId={formId} name="password" label="Password" error={touched.password ? errors.password : ""} help="8+ chars, uppercase, lowercase, number, special char (@$!%*?&)">
              <input
                {...getInputProps("password")}
                type={showPassword ? "text" : "password"}
                className="input-field pr-16"
                placeholder="Create a strong password"
                autoComplete="new-password"
                required
              />
              <LockIcon className="absolute right-9 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
              <button type="button" onClick={() => setShowPassword((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }}>
                {showPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
              </button>
              {values.password && (
                <div className="mt-1.5 text-xs flex flex-wrap gap-x-3 gap-y-1" style={{ color: "var(--text-muted)" }}>
                  <span>Strength: <span className={passwordStrength.color}>{passwordStrength.text}</span></span>
                  <span className={values.password.length >= 8 ? "text-green-500" : ""}>8+</span>
                  <span className={/[A-Z]/.test(values.password) ? "text-green-500" : ""}>A-Z</span>
                  <span className={/[a-z]/.test(values.password) ? "text-green-500" : ""}>a-z</span>
                  <span className={/\d/.test(values.password) ? "text-green-500" : ""}>0-9</span>
                  <span className={/[@$!%*?&]/.test(values.password) ? "text-green-500" : ""}>@$!</span>
                </div>
              )}
            </FormField>

            <FormField formId={formId} name="confirmPassword" label="Confirm Password" error={touched.confirmPassword ? errors.confirmPassword : ""}>
              <input
                {...getInputProps("confirmPassword")}
                type={showConfirmPassword ? "text" : "password"}
                className="input-field pr-16"
                placeholder="Re-enter password"
                autoComplete="new-password"
                required
              />
              <LockIcon className="absolute right-9 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
              <button type="button" onClick={() => setShowConfirmPassword((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }}>
                {showConfirmPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
              </button>
              {values.confirmPassword && !passwordsMatch && <p className="text-xs text-red-500 mt-1">Passwords must match</p>}
              {values.confirmPassword && passwordsMatch && <p className="text-xs text-green-500 mt-1">Passwords match</p>}
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

const FormField = ({ formId, name, label, error, help, children }) => (
  <div className="space-y-1.5">
    <label className="text-sm font-medium" htmlFor={`${formId}-${name}`} style={{ color: "var(--text-secondary)" }}>
      {label}
    </label>
    <div className="relative">{children}</div>
    {help && !error && <p className="field-help-text">{help}</p>}
    {error && (
      <p id={errorId(formId, name)} className="field-error-text" role="alert">
        {error}
      </p>
    )}
  </div>
);

export default Signup;
