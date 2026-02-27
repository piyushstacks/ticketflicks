import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Otp from "../models/Otp.js";
import sendEmail from "../configs/nodeMailer.js";

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

const createToken = (user) => {
  return jwt.sign(
    { id: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

export const signup = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Email already registered" });
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

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
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

// Step 1: login request -> validate credentials, send OTP to email
export const loginRequest = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ success: false, message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ success: false, message: "Invalid credentials" });

  // generate OTP
  const otp = ("000000" + Math.floor(Math.random() * 999999)).slice(-6);
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[dev-otp] login OTP for ${email}: ${otp}`);
    }
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    // store OTP
    await Otp.create({ email, otpHash, purpose: "login", expiresAt });

    // send email (do not include otp in response)
    const subject = "Your login OTP";
    const body = `<p>Your one-time login code is <strong>${otp}</strong>. It will expire in 10 minutes.</p>`;
    try {
      await sendEmail({ to: email, subject, body });
    } catch (err) {
      console.error("[loginRequest][sendEmail]", err);
    }

    res.json({ success: true, message: "OTP sent to registered email" });
  } catch (error) {
    console.error("[loginRequest]", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Resend login OTP (rate limited)
export const resendLoginOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ success: false, message: "User not found" });

    const otp = ("000000" + Math.floor(Math.random() * 999999)).slice(-6);
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[dev-otp] resend login OTP for ${email}: ${otp}`);
    }
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await Otp.create({ email, otpHash, purpose: "login", expiresAt });

    const subject = "Your login OTP (resend)";
    const body = `<p>Your one-time login code is <strong>${otp}</strong>. It will expire in 10 minutes.</p>`;
    try {
      await sendEmail({ to: email, subject, body });
    } catch (err) {
      console.error("[resendLoginOtp][sendEmail]", err);
    }

    res.json({ success: true, message: "OTP resent to registered email" });
  } catch (error) {
    console.error("[resendLoginOtp]", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Step 2: verify OTP and issue token
export const verifyLoginOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: "Email and OTP are required" });

    const otpDoc = await Otp.findOne({ email, purpose: "login", expiresAt: { $gte: new Date() } }).sort({ createdAt: -1 });
    if (!otpDoc) return res.status(400).json({ success: false, message: "OTP not found or expired" });

    const match = await bcrypt.compare(otp, otpDoc.otpHash);
    if (!match) return res.status(400).json({ success: false, message: "Invalid OTP" });

    // OTP valid - remove all login OTPs for this email
    await Otp.deleteMany({ email, purpose: "login" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ success: false, message: "User not found" });

    user.last_login = new Date();
    await user.save();

    const token = createToken(user);

    res.json({
      success: true,
      message: "Login verified",
      token,
      user: { id: user._id.toString(), name: user.name, email: user.email, phone: user.phone, role: user.role },
    });
  } catch (error) {
    console.error("[verifyLoginOtp]", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Forgot password - send OTP
export const forgotPasswordRequest = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.json({ success: true, message: "If the email exists, an OTP has been sent" });

    const otp = ("000000" + Math.floor(Math.random() * 999999)).slice(-6);
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[dev-otp] forgot-password OTP for ${email}: ${otp}`);
    }
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await Otp.create({ email, otpHash, purpose: "forgot", expiresAt });

    const subject = "Your password reset OTP";
    const body = `<p>Your password reset OTP is <strong>${otp}</strong>. It expires in 10 minutes.</p>`;
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

// Resend forgot-password OTP (rate limited)
export const resendForgotOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.json({ success: true, message: "If the email exists, an OTP has been sent" });

    const otp = ("000000" + Math.floor(Math.random() * 999999)).slice(-6);
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[dev-otp] resend forgot-password OTP for ${email}: ${otp}`);
    }
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await Otp.create({ email, otpHash, purpose: "forgot", expiresAt });

    const subject = "Your password reset OTP (resend)";
    const body = `<p>Your password reset OTP is <strong>${otp}</strong>. It expires in 10 minutes.</p>`;
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
    if (!email || !otp || !newPassword) return res.status(400).json({ success: false, message: "Email, OTP and new password are required" });

    const otpDoc = await Otp.findOne({ email, purpose: "forgot", expiresAt: { $gte: new Date() } }).sort({ createdAt: -1 });
    if (!otpDoc) return res.status(400).json({ success: false, message: "OTP not found or expired" });

    const match = await bcrypt.compare(otp, otpDoc.otpHash);
    if (!match) return res.status(400).json({ success: false, message: "Invalid OTP" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ success: false, message: "User not found" });

    user.password_hash = await bcrypt.hash(newPassword, 10);
    await user.save();

    await Otp.deleteMany({ email, purpose: "forgot" });

    res.json({ success: true, message: "Password reset successful" });
  } catch (error) {
    console.error("[resetPasswordWithOtp]", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Change password (authenticated) - expects req.user set by protect middleware
export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ success: false, message: "Current and new password are required" });

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

