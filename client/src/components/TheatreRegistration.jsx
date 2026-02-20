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
    <div className="relative group">
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        title={`Enter your ${label.toLowerCase()}`}
        className={`w-full px-4 py-3 bg-gray-800 border rounded-lg focus:outline-none transition-all duration-200 placeholder-gray-500 text-white hover:bg-gray-750 ${
          error ? "border-red-500" : "border-gray-700 focus:border-primary"
        }`}
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-hover:text-primary transition-colors duration-200">
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
      </div>
    </div>
    {error && <p className="text-red-400 text-sm mt-1 animate-pulse">{error}</p>}
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

  // Legal documents PDF state
  const [legalDocuments, setLegalDocuments] = useState(null);
  const [pdfError, setPdfError] = useState("");

  // Handle PDF file upload
  const handlePdfUpload = (e) => {
    const file = e.target.files[0];
    
    if (!file) {
      setLegalDocuments(null);
      setPdfError("");
      return;
    }

    // Validate file type
    if (file.type !== "application/pdf") {
      setPdfError("Please upload a PDF file only");
      setLegalDocuments(null);
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      setPdfError("PDF file size must be less than 10MB");
      setLegalDocuments(null);
      return;
    }

    setLegalDocuments(file);
    setPdfError("");
  };

  // Remove uploaded PDF
  const removePdf = () => {
    setLegalDocuments(null);
    setPdfError("");
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
  });

  // Screens Management - Initialize with one screen with default pricing
  const [screens, setScreens] = useState([{
    name: '',
    layout: null,
    pricing: { unified: 150 } // Default pricing
  }]);

  const validateEmail = (email) => {
    // More robust email validation regex
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
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
    if (!theatreData.address.trim()) {
      newErrors.address = "Address is required";
    }
    if (!theatreData.city.trim()) {
      newErrors.city = "City is required";
    }
    if (!theatreData.state.trim()) {
      newErrors.state = "State is required";
    }
    if (!theatreData.zipCode.trim()) {
      newErrors.zipCode = "Zip code is required";
    } else if (!/^\d{5}(-\d{4})?$/.test(theatreData.zipCode)) {
      newErrors.zipCode = "Please enter a valid zip code (e.g., 12345 or 12345-6789)";
    }
    if (!theatreData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(theatreData.email)) {
      newErrors.email = "Please enter a valid email address";
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
      } else {
        // Show validation errors for manager data
        toast.error("Please fill in all required manager information");
      }
    } else if (step === 2) {
      if (validateTheatreData()) {
        setStep(3);
        setErrors({});
      } else {
        // Show validation errors for theatre data
        const missingFields = [];
        if (!theatreData.name.trim()) missingFields.push("Theatre Name");
        if (!theatreData.location.trim()) missingFields.push("Location");
        if (!theatreData.contact_no.trim()) missingFields.push("Contact Number");
        if (!theatreData.address.trim()) missingFields.push("Address");
        if (!theatreData.city.trim()) missingFields.push("City");
        if (!theatreData.state.trim()) missingFields.push("State");
        if (!theatreData.zipCode.trim()) missingFields.push("Zip Code");
        if (!theatreData.email.trim()) missingFields.push("Email");
        
        if (missingFields.length > 0) {
          toast.error(`Please fill in: ${missingFields.join(", ")}`);
        } else {
          toast.error("Please fill in all required theatre information");
        }
      }
    } else if (step === 3) {
      // Validate legal documents
      if (!legalDocuments) {
        toast.error("Please upload legal documents to proceed");
        return;
      }
      setStep(4);
      setErrors({});
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
        // Navigate to OTP verification page with all data
        setTimeout(() => {
          // Use window.location to navigate with state
          window.location.href = `/theatre-verify?data=${encodeURIComponent(JSON.stringify({
            managerData,
            theatreData,
            screens,
            legalDocuments
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
              <InputField
                label="Email Address"
                name="email"
                type="email"
                value={theatreData.email}
                onChange={handleTheatreInputChange}
                onBlur={handleTheatreBlur}
                error={errors.email}
                placeholder="theatre@email.com"
              />
              <InputField
                label="Address"
                name="address"
                value={theatreData.address}
                onChange={handleTheatreInputChange}
                onBlur={handleTheatreBlur}
                error={errors.address}
                placeholder="Street address"
              />
              <div className="grid grid-cols-2 gap-4">
                <InputField
                  label="City"
                  name="city"
                  value={theatreData.city}
                  onChange={handleTheatreInputChange}
                  onBlur={handleTheatreBlur}
                  error={errors.city}
                  placeholder="City"
                />
                <InputField
                  label="State"
                  name="state"
                  value={theatreData.state}
                  onChange={handleTheatreInputChange}
                  onBlur={handleTheatreBlur}
                  error={errors.state}
                  placeholder="State"
                />
              </div>
              <InputField
                label="Zip Code"
                name="zipCode"
                value={theatreData.zipCode}
                onChange={handleTheatreInputChange}
                onBlur={handleTheatreBlur}
                error={errors.zipCode}
                placeholder="12345 or 12345-6789"
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

          {/* Step 3: Legal Documents */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Legal Documents</h3>
                <p className="text-gray-400 mb-6">Please upload your legal documents as a combined PDF file.</p>
              </div>

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
                    <label className="block text-sm font-semibold text-white mb-2">
                      Upload Legal Documents (Combined PDF) *
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handlePdfUpload}
                        className="hidden"
                        id="legal-documents-upload"
                      />
                      <label
                        htmlFor="legal-documents-upload"
                        className={`flex items-center justify-center w-full px-4 py-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                          pdfError
                            ? "border-red-500 bg-red-500/10"
                            : legalDocuments
                            ? "border-green-500 bg-green-500/10"
                            : "border-gray-600 bg-gray-800/50 hover:border-primary hover:bg-primary/10"
                        }`}
                      >
                        <div className="text-center">
                          {legalDocuments ? (
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <div className="text-left">
                                <p className="text-white font-medium">{legalDocuments.name}</p>
                                <p className="text-gray-400 text-sm">
                                  {(legalDocuments.size / (1024 * 1024)).toFixed(2)} MB
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={removePdf}
                                className="ml-auto text-red-400 hover:text-red-300 transition-colors"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          ) : (
                            <div>
                              <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                              </div>
                              <p className="text-white font-medium mb-1">Click to upload PDF</p>
                              <p className="text-gray-400 text-sm">Maximum file size: 10MB</p>
                            </div>
                          )}
                        </div>
                      </label>
                    </div>
                    {pdfError && (
                      <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {pdfError}
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
                  ← Previous
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={!legalDocuments}
                  className="flex-1 py-3 bg-primary hover:bg-primary-dull text-white font-semibold rounded-lg transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next: Add Screens →
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
