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
    res.status(500).json({ success: false, message: error.message });
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
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
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
    res.status(500).json({ success: false, message: error.message });
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
    res.status(500).json({ success: false, message: error.message });
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
    res.status(500).json({ success: false, message: error.message });
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
    res.status(500).json({ success: false, message: error.message });
  }
};
