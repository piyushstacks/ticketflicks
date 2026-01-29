import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Otp from "../models/Otp.js";
import sendEmail from "../configs/nodeMailer.js";

const OTP_TTL_MS = 2 * 60 * 1000; // 2 minutes for forgot-password OTP
const PASSWORD_MIN_LENGTH = 8;
// Regex: at least 1 lowercase, 1 uppercase, 1 digit, 1 special char
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const createToken = (user) => {
  return jwt.sign(
    { id: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// Validate password strength
const validatePassword = (password) => {
  if (!password || password.length < PASSWORD_MIN_LENGTH) {
    return { valid: false, message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters long` };
  }
  if (!PASSWORD_REGEX.test(password)) {
    return { valid: false, message: "Password must contain at least 1 uppercase, 1 lowercase, 1 digit, and 1 special character (@$!%*?&)" };
  }
  return { valid: true };
};

export const signup = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ success: false, message: passwordValidation.message });
    }

    // Model will automatically lowercase and trim email
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      phone,
      password_hash,
      role: "customer",
      last_login: new Date(),
    });

    const token = createToken(user);

    res.json({
      success: true,
      message: "Signup successful",
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    
    // Handle specific error cases
    if (error.code === 11000) {
      // MongoDB duplicate key error
      const field = Object.keys(error.keyPattern)[0];
      if (field === 'email') {
        return res.status(400).json({ 
          success: false, 
          message: "This email address is already registered. Please use a different email or try logging in." 
        });
      }
      if (field === 'phone') {
        return res.status(400).json({ 
          success: false, 
          message: "This phone number is already registered. Please use a different phone number." 
        });
      }
      return res.status(400).json({ 
        success: false, 
        message: `An account with this ${field} already exists.` 
      });
    }
    
    if (error.name === 'ValidationError') {
      // Mongoose validation error
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: "Please check your input and try again.",
        details: errors
      });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: "Invalid data format. Please check all fields and try again."
      });
    }
    
    // Generic error with user-friendly message
    res.status(500).json({ 
      success: false, 
      message: "Unable to create your account right now. Please try again in a few minutes." 
    });
  }
};

// Password-based login (no OTP required)
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    // Query with lowercase email (model will apply lowercase automatically)
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ success: false, message: "wrong credentials entered please try again" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "wrong credentials entered please try again" });
    }

    user.last_login = new Date();
    await user.save();

    const token = createToken(user);

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    
    // Handle specific error cases
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: "Invalid email format. Please enter a valid email address."
      });
    }
    
    if (error.message && error.message.includes('timeout')) {
      return res.status(500).json({
        success: false,
        message: "Login is taking too long. Please try again."
      });
    }
    
    // Generic error with user-friendly message
    res.status(500).json({ 
      success: false, 
      message: "Unable to log you in right now. Please try again in a few minutes." 
    });
  }
};

// Request OTP for signup
export const requestSignupOtp = async (req, res) => {
  try {
    console.log("=== REQUEST SIGNUP OTP ===");
    console.log("Request body:", req.body);
    
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email is required" });

    console.log("Email received:", email);

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    console.log("Email regex test result:", emailRegex.test(email));
    
    if (!emailRegex.test(email)) {
      console.log("Email validation failed");
      return res.status(400).json({ success: false, message: "Invalid email format. Please enter a valid email address." });
    }

    console.log("Email validation passed");

    // Query with lowercase email (model will apply lowercase automatically)
    const user = await User.findOne({ email: email.toLowerCase() });
    if (user) return res.status(400).json({ success: false, message: "Email already registered" });

    console.log("Email not found in database, proceeding with OTP generation");

    // Delete any existing OTPs for this email (old OTP expires immediately when new one is sent)
    await Otp.deleteMany({ email: email.toLowerCase(), purpose: "signup" });

    const otp = ("000000" + Math.floor(Math.random() * 999999)).slice(-6);
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[dev-otp] signup OTP for ${email.toLowerCase()}: ${otp}`);
    }
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await Otp.create({ email: email.toLowerCase(), otpHash, purpose: "signup", expiresAt });

    const subject = "Your TicketFlicks Signup OTP";
    const body = `<p>Welcome to TicketFlicks! Your signup OTP is <strong>${otp}</strong>. It expires in 2 minutes.</p>`;
    try {
      await sendEmail({ to: email, subject, body });
    } catch (err) {
      console.error("[requestSignupOtp][sendEmail]", err);
    }

    console.log("OTP sent successfully");
    res.json({ success: true, message: "OTP sent to your email for signup verification" });
  } catch (error) {
    console.error("=== REQUEST SIGNUP OTP ERROR ===");
    console.error("Error:", error);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    
    // Handle specific error cases
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: "This email is already registered." 
      });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: "Invalid email format. Please enter a valid email address."
      });
    }
    
    if (error.message && error.message.includes('timeout')) {
      return res.status(500).json({
        success: false,
        message: "Request is taking too long. Please try again."
      });
    }
    
    // Generic error with user-friendly message
    res.status(500).json({ 
      success: false, 
      message: "Unable to send OTP right now. Please try again in a few minutes." 
    });
  }
};

// Complete signup with OTP verification
export const completeSignupWithOtp = async (req, res) => {
  try {
    const { name, email, phone, password, otp } = req.body;

    // Validation
    if (!name || !email || !phone || !password || !otp) {
      return res.status(400).json({
        success: false,
        message: "All fields and OTP are required",
      });
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.message,
      });
    }

    // Verify OTP
    const otpDoc = await Otp.findOne({ 
      email: email.toLowerCase(), 
      purpose: "signup", 
      expiresAt: { $gte: new Date() } 
    }).sort({ createdAt: -1 });

    if (!otpDoc) {
      return res.status(400).json({ success: false, message: "OTP expired or not found" });
    }

    const match = await bcrypt.compare(otp, otpDoc.otpHash);
    if (!match) return res.status(400).json({ success: false, message: "Invalid OTP" });

    // Check if email already exists (double check)
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      phone,
      password_hash,
      role: "customer",
      last_login: new Date(),
    });

    // Delete all OTPs for this email after successful signup
    await Otp.deleteMany({ email: email.toLowerCase(), purpose: "signup" });

    const token = createToken(user);

    res.json({
      success: true,
      message: "Signup successful",
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Complete signup error:", error);
    
    // Handle specific error cases
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      if (field === 'email') {
        return res.status(400).json({ 
          success: false, 
          message: "This email address is already registered. Please use a different email or try logging in." 
        });
      }
      return res.status(400).json({ 
        success: false, 
        message: `An account with this ${field} already exists.` 
      });
    }
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: "Please check your input and try again.",
        details: errors
      });
    }
    
    // Generic error with user-friendly message
    res.status(500).json({ 
      success: false, 
      message: "Unable to create your account right now. Please try again in a few minutes." 
    });
  }
};

// Forgot password - send OTP (2 min expiry, old OTP auto-expires)
export const forgotPasswordRequest = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email is required" });

    // Query with lowercase email (model will apply lowercase automatically)
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.json({ success: true, message: "If the email exists, an OTP has been sent" });

    // Delete any existing OTPs for this email (old OTP expires immediately when new one is sent)
    await Otp.deleteMany({ email: email.toLowerCase(), purpose: "forgot" });

    const otp = ("000000" + Math.floor(Math.random() * 999999)).slice(-6);
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[dev-otp] forgot-password OTP for ${email.toLowerCase()}: ${otp}`);
    }
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await Otp.create({ email: email.toLowerCase(), otpHash, purpose: "forgot", expiresAt });

    const subject = "Your password reset OTP";
    const body = `<p>Your password reset OTP is <strong>${otp}</strong>. It expires in 2 minutes.</p>`;
    try {
      await sendEmail({ to: email, subject, body });
    } catch (err) {
      console.error("[forgotPasswordRequest][sendEmail]", err);
    }

    res.json({ success: true, message: "If the email exists, an OTP has been sent" });
  } catch (error) {
    console.error("[forgotPasswordRequest]", error);
    
    // Handle specific error cases
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: "Invalid email format. Please enter a valid email address."
      });
    }
    
    if (error.message && error.message.includes('timeout')) {
      return res.status(500).json({
        success: false,
        message: "Request is taking too long. Please try again."
      });
    }
    
    // Generic error with user-friendly message
    res.status(500).json({ 
      success: false, 
      message: "Unable to process your request right now. Please try again in a few minutes." 
    });
  }
};

// Resend forgot-password OTP (rate limited, auto-deletes old OTP)
export const resendForgotOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email is required" });

    // Query with lowercase email (model will apply lowercase automatically)
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.json({ success: true, message: "If the email exists, an OTP has been sent" });

    // Delete old OTP
    await Otp.deleteMany({ email: email.toLowerCase(), purpose: "forgot" });

    const otp = ("000000" + Math.floor(Math.random() * 999999)).slice(-6);
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[dev-otp] resend forgot-password OTP for ${email.toLowerCase()}: ${otp}`);
    }
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await Otp.create({ email: email.toLowerCase(), otpHash, purpose: "forgot", expiresAt });

    const subject = "Your password reset OTP (resend)";
    const body = `<p>Your password reset OTP is <strong>${otp}</strong>. It expires in 2 minutes.</p>`;
    try {
      await sendEmail({ to: email, subject, body });
    } catch (err) {
      console.error("[resendForgotOtp][sendEmail]", err);
    }

    res.json({ success: true, message: "If the email exists, an OTP has been sent" });
  } catch (error) {
    console.error("[resendForgotOtp]", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Reset password with OTP
export const resetPasswordWithOtp = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: "Email, OTP and new password are required" });
    }

    // Validate new password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({ success: false, message: passwordValidation.message });
    }

    // Query with lowercase email
    const otpDoc = await Otp.findOne({ 
      email: email.toLowerCase(), 
      purpose: "forgot", 
      expiresAt: { $gte: new Date() } 
    }).sort({ createdAt: -1 });
    
    if (!otpDoc) return res.status(400).json({ success: false, message: "OTP not found or expired" });

    const match = await bcrypt.compare(otp, otpDoc.otpHash);
    if (!match) return res.status(400).json({ success: false, message: "Invalid OTP" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ success: false, message: "User not found" });

    user.password_hash = await bcrypt.hash(newPassword, 10);
    await user.save();

    // Delete all OTPs for this email
    await Otp.deleteMany({ email: email.toLowerCase(), purpose: "forgot" });

    res.json({ success: true, message: "Password reset successful" });
  } catch (error) {
    console.error("[resetPasswordWithOtp]", error);
    
    // Handle specific error cases
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: "Invalid data format. Please check all fields and try again."
      });
    }
    
    if (error.message && error.message.includes('timeout')) {
      return res.status(500).json({
        success: false,
        message: "Password reset is taking too long. Please try again."
      });
    }
    
    // Generic error with user-friendly message
    res.status(500).json({ 
      success: false, 
      message: "Unable to reset your password right now. Please try again in a few minutes." 
    });
  }
};

// Change password (authenticated)
export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: "New passwords do not match" });
    }

    // Validate new password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({ success: false, message: passwordValidation.message });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(400).json({ success: false, message: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) return res.status(400).json({ success: false, message: "Current password is incorrect" });

    user.password_hash = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error("[changePassword]", error);
    
    // Handle specific error cases
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: "Invalid user data. Please log out and log back in."
      });
    }
    
    if (error.message && error.message.includes('timeout')) {
      return res.status(500).json({
        success: false,
        message: "Password change is taking too long. Please try again."
      });
    }
    
    // Generic error with user-friendly message
    res.status(500).json({ 
      success: false, 
      message: "Unable to change your password right now. Please try again in a few minutes." 
    });
  }
};
