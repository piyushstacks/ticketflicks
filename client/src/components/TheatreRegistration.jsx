import React, { useEffect, useMemo, useState } from "react";
import { AlertCircle, Loader, Plus, X } from "lucide-react";
import { useAuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";
import ScreenConfiguration from "./ScreenConfiguration.jsx";
import { composeValidators, email as emailValidator, errorId, matchesField, minLength, passwordStrong, phone10, required, validateSingleField, validateValues } from "../lib/validation.js";

// Stable, memoized input field component declared at top-level so it
// doesn't get re-created on every render of TheatreRegistration.
const InputField = React.memo(({ formId, label, name, type = "text", value, onChange, onBlur, error, placeholder, help }) => (
  <div>
    <label className="block text-sm font-semibold text-white mb-2" htmlFor={`${formId}-${name}`}>
      {label} *
    </label>
    <div className="relative group">
      <input
        id={`${formId}-${name}`}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        title={`Enter your ${label.toLowerCase()}`}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? errorId(formId, name) : undefined}
        className={`w-full px-4 py-3 bg-gray-800 border rounded-lg focus:outline-none transition-all duration-200 placeholder-gray-500 text-white hover:bg-gray-750 ${
          error ? "border-red-500" : "border-gray-700 focus:border-primary"
        }`}
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-hover:text-primary transition-colors duration-200">
        {error ? (
          <AlertCircle className="w-5 h-5 text-red-400" />
        ) : (
          <>
            {type === "email" && (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                <path d="m22 7-10 5L2 7"></path>
              </svg>
            )}
            {type === "tel" && (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
            )}
            {type === "password" && (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            )}
            {(type === "text" || !type) && (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            )}
          </>
        )}
      </div>
    </div>
    {help && !error && <p className="field-help-text mt-1">{help}</p>}
    {error && (
      <p id={errorId(formId, name)} className="field-error-text mt-1" role="alert">
        {error}
      </p>
    )}
  </div>
));

InputField.displayName = "InputField";

const validateZip = (value) => {
  const v = (value || "").toString().trim();
  if (!v) return "Zip code is required";
  const digits = v.replace(/\D/g, "");
  if (digits.length !== v.length) return "Zip code must contain only digits";
  if (digits.length !== 5 && digits.length !== 6) return "Zip code must be 5 or 6 digits";
  return "";
};

const TheatreRegistration = ({ onClose }) => {
  const { requestTheatreRegistrationOtp } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Manager Info, 2: Theatre Info, 3: Screens

  const fillDemoData = async () => {
    if (!import.meta.env.DEV) return;

    const now = Date.now();
    const demoEmail = `demo.manager+${now}@example.com`;

    setManagerData({
      name: "Demo Manager",
      email: demoEmail,
      phone: "9876543210",
      password: "Demo@1234",
      confirmPassword: "Demo@1234",
    });

    setTheatreData({
      name: "Demo Theatre",
      location: "Downtown",
      contact_no: "9876543210",
      address: "123 Demo Street",
      city: "Mumbai",
      state: "Maharashtra",
      zipCode: "400001",
      email: `demo.theatre+${now}@example.com`,
      step3_pdf_url: "https://drive.google.com/file/d/DEMO/view?usp=sharing",
    });

    setScreens([
      {
        name: "Screen 1",
        layout: {
          rows: 5,
          seatsPerRow: 10,
          totalSeats: 50,
          layout: Array.from({ length: 5 }, () => Array.from({ length: 10 }, () => "S")),
        },
        pricing: { unified: 150 },
      },
    ]);

    setLegalTouched(false);

    toast.success("Demo data filled");
  };

  // Manager Information
  const [managerData, setManagerData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  // Validation errors
  const [managerErrors, setManagerErrors] = useState({});
  const [managerTouched, setManagerTouched] = useState({});
  const [theatreErrors, setTheatreErrors] = useState({});
  const [theatreTouched, setTheatreTouched] = useState({});
  const [legalTouched, setLegalTouched] = useState(false);

  // Step validation states
  const [isStep1Valid, setIsStep1Valid] = useState(false);
  const [isStep2Valid, setIsStep2Valid] = useState(false);
  const [isStep3Valid, setIsStep3Valid] = useState(false);

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

  const isValidUrl = (value) => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  };

  const validateDriveUrl = (value) => {
    const v = (value || "").toString().trim();
    if (!v) return "Google Drive link is required";
    if (!isValidUrl(v)) return "Please enter a valid URL";
    if (!v.includes("drive.google.com")) return "Please enter a valid Google Drive link";
    return "";
  };
  const passwordsMatch = managerData.password === managerData.confirmPassword;

  // Theatre Information
  const [theatreData, setTheatreData] = useState({
    name: "",
    location: "",
    contact_no: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    email: "",
    step3_pdf_url: "",
  });

  // Screens Management - Initialize with one screen with default pricing
  const [screens, setScreens] = useState([{
    name: '',
    layout: null,
    pricing: { unified: 150 } // Default pricing
  }]);

  const managerSchema = useMemo(
    () => ({
      name: composeValidators(required("Manager name"), minLength("Manager name", 2)),
      email: emailValidator("Email"),
      phone: phone10("Phone number"),
      password: passwordStrong("Password"),
      confirmPassword: composeValidators(required("Confirm password"), matchesField("password", "Passwords must match")),
    }),
    []
  );

  const theatreSchema = useMemo(
    () => ({
      name: composeValidators(required("Theatre name"), minLength("Theatre name", 2)),
      location: required("Location"),
      contact_no: phone10("Contact number"),
      address: required("Address"),
      city: required("City"),
      state: required("State"),
      zipCode: validateZip,
      email: emailValidator("Email"),
    }),
    []
  );

  // Real-time validation for step 1
  useEffect(() => {
    setIsStep1Valid(Object.keys(validateValues(managerSchema, managerData)).length === 0);
  }, [managerData]);

  // Real-time validation for step 2
  useEffect(() => {
    setIsStep2Valid(Object.keys(validateValues(theatreSchema, theatreData)).length === 0);
  }, [theatreData]);

  // Real-time validation for step 3
  useEffect(() => {
    setIsStep3Valid(!validateDriveUrl(theatreData.step3_pdf_url));
  }, [theatreData.step3_pdf_url]);

  const validateManagerData = () => {
    const nextErrors = validateValues(managerSchema, managerData);
    setManagerErrors(nextErrors);
    const nextTouched = {};
    for (const key of Object.keys(managerSchema)) nextTouched[key] = true;
    setManagerTouched((prev) => ({ ...nextTouched, ...prev }));
    return Object.keys(nextErrors).length === 0;
  };

  const validateTheatreData = () => {
    const nextErrors = validateValues(theatreSchema, theatreData);
    setTheatreErrors(nextErrors);
    const nextTouched = {};
    for (const key of Object.keys(theatreSchema)) nextTouched[key] = true;
    setTheatreTouched((prev) => ({ ...nextTouched, ...prev }));
    return Object.keys(nextErrors).length === 0;
  };

  // Handle manager input change
  const handleManagerInputChange = (e) => {
    const { name, value } = e.target;
    setManagerData((prev) => {
      const next = { ...prev, [name]: value };
      if (managerTouched[name]) {
        const error = validateSingleField(managerSchema, next, name);
        setManagerErrors((prevErrors) => {
          const updated = { ...prevErrors };
          if (error) updated[name] = error;
          else delete updated[name];
          return updated;
        });
      }
      if (name === "password" && managerTouched.confirmPassword) {
        const confirmError = validateSingleField(managerSchema, next, "confirmPassword");
        setManagerErrors((prevErrors) => {
          const updated = { ...prevErrors };
          if (confirmError) updated.confirmPassword = confirmError;
          else delete updated.confirmPassword;
          return updated;
        });
      }
      return next;
    });
  };

  // Validate manager field on blur
  const handleManagerBlur = (e) => {
    const { name } = e.target;
    setManagerTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateSingleField(managerSchema, managerData, name);
    setManagerErrors((prevErrors) => {
      const updated = { ...prevErrors };
      if (error) updated[name] = error;
      else delete updated[name];
      return updated;
    });
  };

  // Handle theatre input change
  const handleTheatreInputChange = (e) => {
    const { name, value } = e.target;
    setTheatreData((prev) => {
      const next = { ...prev, [name]: value };
      if (theatreTouched[name]) {
        const error = validateSingleField(theatreSchema, next, name);
        setTheatreErrors((prevErrors) => {
          const updated = { ...prevErrors };
          if (error) updated[name] = error;
          else delete updated[name];
          return updated;
        });
      }
      return next;
    });
  };

  // Validate theatre field on blur
  const handleTheatreBlur = (e) => {
    const { name } = e.target;
    setTheatreTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateSingleField(theatreSchema, theatreData, name);
    setTheatreErrors((prevErrors) => {
      const updated = { ...prevErrors };
      if (error) updated[name] = error;
      else delete updated[name];
      return updated;
    });
  };

  // Handle step progression
  const handleNextStep = () => {
    if (step === 1) {
      if (validateManagerData()) {
        setStep(2);
        setManagerErrors({});
      } else {
        // Show validation errors for manager data
        toast.error(Object.values(validateValues(managerSchema, managerData))[0] || "Please fix the highlighted fields");
      }
    } else if (step === 2) {
      if (validateTheatreData()) {
        setStep(3);
        setTheatreErrors({});
      } else {
        toast.error(Object.values(validateValues(theatreSchema, theatreData))[0] || "Please fix the highlighted fields");
      }
    } else if (step === 3) {
      const err = validateDriveUrl(theatreData.step3_pdf_url);
      if (err) {
        setLegalTouched(true);
        toast.error(err);
        return;
      }
      setStep(4);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Validate all screens have required data
    const invalidScreens = screens.filter(screen => {
      // Check if screen has basic required fields
      if (!screen.name?.trim() || !screen.layout) {
        return true;
      }
      
      // Check pricing - it should not be empty object and should have valid prices
      if (!screen.pricing || Object.keys(screen.pricing).length === 0) {
        return true;
      }
      
      // Check if pricing has valid values
      const pricingValues = Object.values(screen.pricing);
      if (pricingValues.length === 0) {
        return true;
      }
      
      // Check if any price is invalid (0, negative, or NaN)
      const hasInvalidPrice = pricingValues.some(price => {
        if (typeof price === 'object') {
          return !price.price || price.price <= 0 || isNaN(price.price);
        }
        return !price || price <= 0 || isNaN(price);
      });
      
      return hasInvalidPrice;
    });
    
    if (invalidScreens.length > 0) {
      toast.error("Please complete all screen configurations with valid pricing");
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
        if (import.meta.env.DEV && response.devOtp) {
          toast.success(`Dev OTP: ${response.devOtp}`);
        }
        // Navigate to OTP verification page with all data
        setTimeout(() => {
          // Use window.location to navigate with state
          window.location.href = `/theatre-verify?data=${encodeURIComponent(JSON.stringify({
            managerData,
            theatreData,
            screens,
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
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-white">Register Your Theatre</h2>
            <p className="text-sm text-gray-400 mt-1">Step {step} of 4</p>
          </div>
          {import.meta.env.DEV && (
            <button
              type="button"
              onClick={fillDemoData}
              className="hidden sm:inline-flex px-3 py-2 text-xs font-semibold rounded-lg bg-gray-800 hover:bg-gray-700 text-white border border-gray-700"
            >
              Use Demo Data
            </button>
          )}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Content */}
        <div className="px-6 py-6">
          {/* Step 1: Manager Information */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Manager Information</h3>
                <p className="text-gray-400 mb-6">Please provide your personal details for the theatre manager account.</p>
              </div>
              {import.meta.env.DEV && (
                <button
                  type="button"
                  onClick={fillDemoData}
                  className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg transition active:scale-95 border border-gray-700"
                >
                  Use Demo Data
                </button>
              )}
              <InputField
                formId="theatre-manager"
                label="Manager Name"
                name="name"
                value={managerData.name}
                onChange={handleManagerInputChange}
                onBlur={handleManagerBlur}
                error={managerTouched.name ? managerErrors.name : ""}
                placeholder="Your full name"
              />
              <InputField
                formId="theatre-manager"
                label="Manager Email"
                name="email"
                type="email"
                value={managerData.email}
                onChange={handleManagerInputChange}
                onBlur={handleManagerBlur}
                error={managerTouched.email ? managerErrors.email : ""}
                placeholder="your@email.com"
              />
              <InputField
                formId="theatre-manager"
                label="Phone Number"
                name="phone"
                type="tel"
                value={managerData.phone}
                onChange={handleManagerInputChange}
                onBlur={handleManagerBlur}
                error={managerTouched.phone ? managerErrors.phone : ""}
                placeholder="10 digit mobile number"
                help="Must be 10 digits"
              />
              <div>
                <label className="block text-sm font-semibold text-white mb-2" htmlFor="theatre-manager-password">
                  Password *
                </label>
                <input
                  id="theatre-manager-password"
                  type="password"
                  name="password"
                  value={managerData.password}
                  onChange={handleManagerInputChange}
                  onBlur={handleManagerBlur}
                  placeholder="Min 8 chars, 1 upper, 1 lower, 1 digit, 1 special"
                  aria-invalid={managerTouched.password && managerErrors.password ? "true" : undefined}
                  aria-describedby={managerTouched.password && managerErrors.password ? errorId("theatre-manager", "password") : undefined}
                  className={`w-full px-4 py-3 bg-gray-800 border rounded-lg focus:outline-none transition placeholder-gray-500 text-white ${
                    managerTouched.password && managerErrors.password ? "border-red-500" : "border-gray-700 focus:border-primary"
                  }`}
                />
                {managerTouched.password && managerErrors.password && (
                  <p id={errorId("theatre-manager", "password")} className="field-error-text mt-1" role="alert">
                    {managerErrors.password}
                  </p>
                )}
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
                <label className="block text-sm font-semibold text-white mb-2" htmlFor="theatre-manager-confirmPassword">
                  Confirm Password *
                </label>
                <input
                  id="theatre-manager-confirmPassword"
                  type="password"
                  name="confirmPassword"
                  value={managerData.confirmPassword}
                  onChange={handleManagerInputChange}
                  onBlur={handleManagerBlur}
                  placeholder="Re-enter your password"
                  aria-invalid={managerTouched.confirmPassword && managerErrors.confirmPassword ? "true" : undefined}
                  aria-describedby={managerTouched.confirmPassword && managerErrors.confirmPassword ? errorId("theatre-manager", "confirmPassword") : undefined}
                  className={`w-full px-4 py-3 bg-gray-800 border rounded-lg focus:outline-none transition placeholder-gray-500 text-white ${
                    managerTouched.confirmPassword && managerErrors.confirmPassword
                      ? "border-red-500" 
                      : managerData.confirmPassword && !passwordsMatch
                      ? "border-red-500"
                      : managerData.confirmPassword && passwordsMatch
                      ? "border-green-500"
                      : "border-gray-700 focus:border-primary"
                  }`}
                />
                {managerTouched.confirmPassword && managerErrors.confirmPassword && (
                  <p id={errorId("theatre-manager", "confirmPassword")} className="field-error-text mt-1" role="alert">
                    {managerErrors.confirmPassword}
                  </p>
                )}
                {managerData.confirmPassword && !passwordsMatch && (
                  <p className="text-red-400 text-sm mt-1">Passwords do not match</p>
                )}
                {managerData.confirmPassword && passwordsMatch && (
                  <p className="text-green-400 text-sm mt-1">Passwords match ✓</p>
                )}
              </div>

              <button
                onClick={handleNextStep}
                disabled={!isStep1Valid}
                className="w-full py-3 bg-primary hover:bg-primary-dull text-white font-semibold rounded-lg transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next: Theatre Details →
              </button>
            </div>
          )}

          {/* Step 2: Theatre Information */}
          {step === 2 && (
            <div className="space-y-6">
              {import.meta.env.DEV && (
                <button
                  type="button"
                  onClick={fillDemoData}
                  className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg transition active:scale-95 border border-gray-700"
                >
                  Use Demo Data
                </button>
              )}
              <InputField
                formId="theatre-details"
                label="Theatre Name"
                name="name"
                value={theatreData.name}
                onChange={handleTheatreInputChange}
                onBlur={handleTheatreBlur}
                error={theatreTouched.name ? theatreErrors.name : ""}
                placeholder="e.g., PVR Cinemas, Inox"
              />
              <InputField
                formId="theatre-details"
                label="Location"
                name="location"
                value={theatreData.location}
                onChange={handleTheatreInputChange}
                onBlur={handleTheatreBlur}
                error={theatreTouched.location ? theatreErrors.location : ""}
                placeholder="e.g., Bandra, Downtown"
              />
              <InputField
                formId="theatre-details"
                label="Theatre Contact Number"
                name="contact_no"
                type="tel"
                value={theatreData.contact_no}
                onChange={handleTheatreInputChange}
                onBlur={handleTheatreBlur}
                error={theatreTouched.contact_no ? theatreErrors.contact_no : ""}
                placeholder="10 digit mobile number"
                help="Must be 10 digits"
              />
              <InputField
                formId="theatre-details"
                label="Email Address"
                name="email"
                type="email"
                value={theatreData.email}
                onChange={handleTheatreInputChange}
                onBlur={handleTheatreBlur}
                error={theatreTouched.email ? theatreErrors.email : ""}
                placeholder="theatre@email.com"
              />
              <InputField
                formId="theatre-details"
                label="Address"
                name="address"
                value={theatreData.address}
                onChange={handleTheatreInputChange}
                onBlur={handleTheatreBlur}
                error={theatreTouched.address ? theatreErrors.address : ""}
                placeholder="Street address"
              />
              <div className="grid grid-cols-2 gap-4">
                <InputField
                  formId="theatre-details"
                  label="City"
                  name="city"
                  value={theatreData.city}
                  onChange={handleTheatreInputChange}
                  onBlur={handleTheatreBlur}
                  error={theatreTouched.city ? theatreErrors.city : ""}
                  placeholder="City"
                />
                <InputField
                  formId="theatre-details"
                  label="State"
                  name="state"
                  value={theatreData.state}
                  onChange={handleTheatreInputChange}
                  onBlur={handleTheatreBlur}
                  error={theatreTouched.state ? theatreErrors.state : ""}
                  placeholder="State"
                />
              </div>
              <InputField
                formId="theatre-details"
                label="Zip Code"
                name="zipCode"
                value={theatreData.zipCode}
                onChange={handleTheatreInputChange}
                onBlur={handleTheatreBlur}
                error={theatreTouched.zipCode ? theatreErrors.zipCode : ""}
                placeholder="5 or 6 digit zip code"
                help="5 digits (US) or 6 digits (IN)"
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
                  disabled={!isStep2Valid}
                  className="flex-1 py-3 bg-primary hover:bg-primary-dull text-white font-semibold rounded-lg transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next: Add Screens →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Legal Documents */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Legal Documents</h3>
                <p className="text-gray-400 mb-6">Paste a Google Drive link to your verification PDF.</p>
              </div>

              {import.meta.env.DEV && (
                <button
                  type="button"
                  onClick={fillDemoData}
                  className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg transition active:scale-95 border border-gray-700"
                >
                  Use Demo Data
                </button>
              )}

              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <h4 className="text-lg font-medium text-white mb-3">Required Documents:</h4>
                <ul className="space-y-2 text-gray-300 mb-6">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>GST Certificate</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>PAN Card (Business/Proprietor)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Business Registration Proof</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Any other relevant business licenses</span>
                  </li>
                </ul>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2" htmlFor="theatre-legal-step3_pdf_url">
                      Google Drive Link (Verification PDF) *
                    </label>
                    <input
                      id="theatre-legal-step3_pdf_url"
                      type="url"
                      value={theatreData.step3_pdf_url}
                      onChange={(e) => {
                        const value = e.target.value;
                        setTheatreData((prev) => ({ ...prev, step3_pdf_url: value }));
                      }}
                      onBlur={() => setLegalTouched(true)}
                      placeholder="https://drive.google.com/file/d/.../view"
                      aria-invalid={legalTouched && !!validateDriveUrl(theatreData.step3_pdf_url) ? "true" : undefined}
                      aria-describedby={
                        legalTouched && validateDriveUrl(theatreData.step3_pdf_url)
                          ? errorId("theatre-legal", "step3_pdf_url")
                          : undefined
                      }
                      className={`w-full px-4 py-3 bg-gray-800 border rounded-lg focus:outline-none transition-all duration-200 placeholder-gray-500 text-white hover:bg-gray-750 ${
                        legalTouched && validateDriveUrl(theatreData.step3_pdf_url)
                          ? "border-red-500"
                          : "border-gray-700 focus:border-primary"
                      }`}
                    />
                    <p className="field-help-text mt-1">Paste a shareable Google Drive link (must contain drive.google.com)</p>
                    {legalTouched && validateDriveUrl(theatreData.step3_pdf_url) && (
                      <p id={errorId("theatre-legal", "step3_pdf_url")} className="field-error-text mt-2" role="alert">
                        {validateDriveUrl(theatreData.step3_pdf_url)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition active:scale-95"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={!!validateDriveUrl(theatreData.step3_pdf_url)}
                  className="flex-1 py-3 bg-primary hover:bg-primary-dull text-white font-semibold rounded-lg transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Forward: Screen Config →
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Screen Configuration */}
          {step === 4 && (
            <ScreenConfiguration
              screens={screens}
              setScreens={setScreens}
              onNext={handleSubmit}
              onPrevious={() => setStep(3)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default TheatreRegistration;
