import React, { useState } from "react";
import { X, Plus, Trash2, Loader } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { useAuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";
import ScreenConfiguration from "./ScreenConfiguration.jsx";

// Stable, memoized input field component declared at top-level so it
// doesn't get re-created on every render of TheatreRegistration.
const InputField = React.memo(({ label, name, type = "text", value, onChange, onBlur, error, placeholder }) => (
  <div>
    <label className="block text-sm font-semibold text-white mb-2">
      {label} *
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      placeholder={placeholder}
      className={`w-full px-4 py-3 bg-gray-800 border rounded-lg focus:outline-none transition placeholder-gray-500 text-white ${
        error ? "border-red-500" : "border-gray-700 focus:border-primary"
      }`}
    />
    {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
  </div>
));

InputField.displayName = "InputField";

const TheatreRegistration = ({ onClose }) => {
  const { axios } = useAppContext();
  const { requestTheatreRegistrationOtp } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Manager Info, 2: Theatre Info, 3: Screens

  // Manager Information
  const [managerData, setManagerData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  // Validation errors
  const [errors, setErrors] = useState({});

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

  // Password strength state
  const passwordStrength = getPasswordStrength(managerData.password);
  const passwordsMatch = managerData.password === managerData.confirmPassword;

  // Theatre Information
  const [theatreData, setTheatreData] = useState({
    name: "",
    location: "",
    contact_no: "",
  });

  // Screens Management - Initialize with one empty screen
  const [screens, setScreens] = useState([{
    name: '',
    layout: null,
    pricing: {}
  }]);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    if (!password || password.length < 8) {
      return { valid: false, message: "Password must be at least 8 characters" };
    }
    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password) || !/[@$!%*?&]/.test(password)) {
      return { valid: false, message: "Password must include uppercase, lowercase, numbers, and special characters (@$!%*?&)" };
    }
    return { valid: true };
  };

  const validatePhone = (phone) => {
    // Normalize: strip non-digit characters then check exact 10 digits
    const digits = (phone || "").replace(/\D/g, "");
    return digits.length === 10;
  };

  const validateManagerData = () => {
    const newErrors = {};

    if (!managerData.name.trim()) {
      newErrors.name = "Manager name is required";
    }
    if (!managerData.email.trim()) {
      newErrors.email = "Manager email is required";
    } else if (!validateEmail(managerData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!managerData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!validatePhone(managerData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }
    if (!managerData.password) {
      newErrors.password = "Password is required";
    } else {
      const passwordValidation = validatePassword(managerData.password);
      if (!passwordValidation.valid) {
        newErrors.password = passwordValidation.message;
      }
    }
    if (managerData.password !== managerData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateTheatreData = () => {
    const newErrors = {};

    if (!theatreData.name.trim()) {
      newErrors.name = "Theatre name is required";
    }
    if (!theatreData.location.trim()) {
      newErrors.location = "Location is required";
    }
    if (!theatreData.contact_no.trim()) {
      newErrors.contact_no = "Contact number is required";
    } else if (!validatePhone(theatreData.contact_no)) {
      newErrors.contact_no = "Please enter a valid phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle manager input change
  const handleManagerInputChange = (e) => {
    const { name, value } = e.target;
    setManagerData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear password error when user types in password field
    if (name === "password" && errors.password) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated.password;
        return updated;
      });
    }
    
    // Clear confirm password error when user types in confirm password field
    if (name === "confirmPassword" && errors.confirmPassword) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated.confirmPassword;
        return updated;
      });
    }
  };

  // Clear manager error on blur
  const handleManagerBlur = (e) => {
    const { name } = e.target;
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle theatre input change
  const handleTheatreInputChange = (e) => {
    const { name, value } = e.target;
    setTheatreData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Clear theatre error on blur
  const handleTheatreBlur = (e) => {
    const { name } = e.target;
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle step progression
  const handleNextStep = () => {
    if (step === 1) {
      if (validateManagerData()) {
        setStep(2);
        setErrors({});
      }
    } else if (step === 2) {
      if (validateTheatreData()) {
        setStep(3);
        setErrors({});
      }
    }
  };

  // Handle registration submission - Request OTP
  const handleSubmit = async () => {
    // Validate all screens have required data
    const invalidScreens = screens.filter(screen => 
      !screen.name?.trim() || !screen.layout || !screen.pricing
    );
    
    if (invalidScreens.length > 0) {
      toast.error("Please complete all screen configurations");
      return;
    }

    try {
      setLoading(true);

      // Request OTP for manager email
      const response = await requestTheatreRegistrationOtp({ 
        email: managerData.email 
      });

      console.log("OTP request response:", response);

      if (response && response.success) {
        toast.success("OTP sent to your email!");
        // Navigate to OTP verification page with all data
        setTimeout(() => {
          // Use window.location to navigate with state
          window.location.href = `/theatre-verify?data=${encodeURIComponent(JSON.stringify({
            managerData,
            theatreData,
            screens
          }))}`;
        }, 1000);
      } else {
        toast.error(response?.message || "Failed to send OTP");
      }
    } catch (error) {
      console.error("OTP request error:", error);
      toast.error(
        error.response?.data?.message || error.message || "Failed to send OTP"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Register Your Theatre</h2>
            <p className="text-sm text-gray-400 mt-1">Step {step} of 3</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-800 rounded-lg transition"
          >
            <X className="w-6 h-6 text-gray-400 hover:text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Manager Information */}
          {step === 1 && (
            <div className="space-y-6">
              <InputField
                label="Manager Name"
                name="name"
                value={managerData.name}
                onChange={handleManagerInputChange}
                onBlur={handleManagerBlur}
                error={errors.name}
                placeholder="Your full name"
              />
              <InputField
                label="Manager Email"
                name="email"
                type="email"
                value={managerData.email}
                onChange={handleManagerInputChange}
                onBlur={handleManagerBlur}
                error={errors.email}
                placeholder="your@email.com"
              />
              <InputField
                label="Phone Number"
                name="phone"
                type="tel"
                value={managerData.phone}
                onChange={handleManagerInputChange}
                onBlur={handleManagerBlur}
                error={errors.phone}
                placeholder="10 digit mobile number"
              />
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  value={managerData.password}
                  onChange={handleManagerInputChange}
                  onBlur={handleManagerBlur}
                  placeholder="Min 8 chars, 1 upper, 1 lower, 1 digit, 1 special"
                  className={`w-full px-4 py-3 bg-gray-800 border rounded-lg focus:outline-none transition placeholder-gray-500 text-white ${
                    errors.password ? "border-red-500" : "border-gray-700 focus:border-primary"
                  }`}
                />
                {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password}</p>}
                <div className="mt-2 text-xs">
                  <p>
                    Strength:{" "}
                    <span className={passwordStrength.color}>
                      {passwordStrength.text}
                    </span>
                  </p>
                  <p className="text-gray-400 mt-1">
                    <span className={managerData.password.length >= 8 ? "text-green-400" : "text-gray-400"}>
                      ✓ 8+ characters
                    </span>
                    {"\n"}
                    <span className={/[A-Z]/.test(managerData.password) ? "text-green-400" : "text-gray-400"}>
                      ✓ Uppercase
                    </span>
                    {"\n"}
                    <span className={/[a-z]/.test(managerData.password) ? "text-green-400" : "text-gray-400"}>
                      ✓ Lowercase
                    </span>
                    {"\n"}
                    <span className={/\d/.test(managerData.password) ? "text-green-400" : "text-gray-400"}>
                      ✓ Number
                    </span>
                    {"\n"}
                    <span className={/[@$!%*?&]/.test(managerData.password) ? "text-green-400" : "text-gray-400"}>
                      ✓ Special char (@$!%*?&)
                    </span>
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={managerData.confirmPassword}
                  onChange={handleManagerInputChange}
                  onBlur={handleManagerBlur}
                  placeholder="Re-enter your password"
                  className={`w-full px-4 py-3 bg-gray-800 border rounded-lg focus:outline-none transition placeholder-gray-500 text-white ${
                    errors.confirmPassword 
                      ? "border-red-500" 
                      : managerData.confirmPassword && !passwordsMatch
                      ? "border-red-500"
                      : managerData.confirmPassword && passwordsMatch
                      ? "border-green-500"
                      : "border-gray-700 focus:border-primary"
                  }`}
                />
                {errors.confirmPassword && <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>}
                {managerData.confirmPassword && !passwordsMatch && (
                  <p className="text-red-400 text-sm mt-1">Passwords do not match</p>
                )}
                {managerData.confirmPassword && passwordsMatch && (
                  <p className="text-green-400 text-sm mt-1">Passwords match ✓</p>
                )}
              </div>

              <button
                onClick={handleNextStep}
                disabled={!passwordsMatch || passwordStrength.score < 3}
                className="w-full py-3 bg-primary hover:bg-primary-dull text-white font-semibold rounded-lg transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next: Theatre Details →
              </button>
            </div>
          )}

          {/* Step 2: Theatre Information */}
          {step === 2 && (
            <div className="space-y-6">
              <InputField
                label="Theatre Name"
                name="name"
                value={theatreData.name}
                onChange={handleTheatreInputChange}
                onBlur={handleTheatreBlur}
                error={errors.name}
                placeholder="e.g., PVR Cinemas, Inox"
              />
              <InputField
                label="Location"
                name="location"
                value={theatreData.location}
                onChange={handleTheatreInputChange}
                onBlur={handleTheatreBlur}
                error={errors.location}
                placeholder="e.g., Bandra, Downtown"
              />
              <InputField
                label="Theatre Contact Number"
                name="contact_no"
                type="tel"
                value={theatreData.contact_no}
                onChange={handleTheatreInputChange}
                onBlur={handleTheatreBlur}
                error={errors.contact_no}
                placeholder="10 digit mobile number"
              />

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg transition active:scale-95"
                >
                  ← Back
                </button>
                <button
                  onClick={handleNextStep}
                  className="flex-1 py-3 bg-primary hover:bg-primary-dull text-white font-semibold rounded-lg transition active:scale-95"
                >
                  Next: Add Screens →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Screen Configuration */}
          {step === 3 && (
            <ScreenConfiguration
              screens={screens}
              setScreens={setScreens}
              onNext={handleSubmit}
              onPrevious={() => setStep(2)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default TheatreRegistration;
