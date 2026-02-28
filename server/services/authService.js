/**
 * Authentication service
 * Handles user signup, login, OTP, password reset
 */

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Otp from "../models/Otp.js";
import sendEmail from "../configs/nodeMailer.js";
import {
  validateSignupData,
  validateLoginData,
  validatePassword,
  sanitizeEmail,
  validateEmail,
} from "./validationService.js";
import {
  ValidationError,
  NotFoundError,
  AlreadyExistsError,
  UnauthorizedError,
} from "./errorService.js";

const OTP_TTL_MS = 2 * 60 * 1000; // 2 minutes for forgot-password OTP
const BCRYPT_ROUNDS = 10;

/**
 * Create JWT token for user
 */
const createToken = (user) => {
  return jwt.sign(
    { id: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

/**
 * Format user data for response
 */
const formatUserResponse = (user) => {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    managedTheatreId: user.managedTheatreId,
  };
};

/**
 * Sign up a new user
 */
export const signup = async (data) => {
  // Validate input
  const validation = validateSignupData(data);
  if (!validation.valid) {
    throw new ValidationError(validation.message);
  }

  const { name, email, phone, password } = data;
  const normalizedEmail = sanitizeEmail(email);

  // Check if email already exists
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new AlreadyExistsError("Email");
  }

  // Hash password
  const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  // Create user
  const user = await User.create({
    name,
    email: normalizedEmail,
    phone,
    password_hash,
    role: "customer",
    last_login: new Date(),
  });

  // Create token
  const token = createToken(user);

  return {
    token,
    user: formatUserResponse(user),
  };
};

/**
 * Login user with email and password
 */
export const login = async (data) => {
  // Validate input
  const validation = validateLoginData(data);
  if (!validation.valid) {
    throw new ValidationError(validation.message);
  }

  const { email, password } = data;
  const normalizedEmail = sanitizeEmail(email);

  // Find user (including password_hash for comparison)
  const user = await User.findOne({ email: normalizedEmail }).select(
    "+password_hash"
  );
  if (!user) {
    throw new UnauthorizedError("Invalid email or password");
  }

  // Compare password
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new UnauthorizedError("Invalid email or password");
  }

  // Update last login
  user.last_login = new Date();
  await user.save();

  // Create token
  const token = createToken(user);

  return {
    token,
    user: formatUserResponse(user),
  };
};

/**
 * Request OTP for password reset
 */
export const requestPasswordResetOtp = async (email) => {
  // Validate email
  const emailValidation = validateEmail(email);
  if (!emailValidation.valid) {
    throw new ValidationError(emailValidation.message);
  }

  const normalizedEmail = sanitizeEmail(email);

  // Check if user exists (but return generic message for security)
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    // Don't reveal if email exists
    return { success: true, message: "If email exists, OTP has been sent" };
  }

  // Delete any existing OTPs for this email
  await Otp.deleteMany({ email: normalizedEmail, purpose: "forgot" });

  // Generate OTP
  const otp = ("000000" + Math.floor(Math.random() * 999999)).slice(-6);
  const otpHash = await bcrypt.hash(otp, BCRYPT_ROUNDS);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await Otp.create({
    email: normalizedEmail,
    otpHash,
    purpose: "forgot",
    expiresAt,
  });

  // Log OTP in development
  if (process.env.NODE_ENV !== "production") {
    console.log(`[DEV] Password reset OTP for ${normalizedEmail}: ${otp}`);
  }

  // Send email
  try {
    await sendEmail({
      to: normalizedEmail,
      subject: "Password Reset OTP",
      body: `<p>Your password reset OTP is <strong>${otp}</strong>. It expires in 2 minutes.</p>`,
    });
  } catch (err) {
    console.error("[requestPasswordResetOtp] Email send failed:", err);
    if (process.env.NODE_ENV === "production") {
      throw err;
    }
  }

  return { success: true, message: "If email exists, OTP has been sent" };
};

/**
 * Verify OTP and reset password
 */
export const resetPasswordWithOtp = async (email, otp, newPassword) => {
  // Validate inputs
  const emailValidation = validateEmail(email);
  if (!emailValidation.valid) {
    throw new ValidationError(emailValidation.message);
  }

  if (!otp || otp.length !== 6) {
    throw new ValidationError("Invalid OTP format");
  }

  const passwordValidation = validatePassword(newPassword);
  if (!passwordValidation.valid) {
    throw new ValidationError(passwordValidation.message);
  }

  const normalizedEmail = sanitizeEmail(email);

  // Find OTP record
  const otpRecord = await Otp.findOne({
    email: normalizedEmail,
    purpose: "forgot",
  });

  if (!otpRecord) {
    throw new ValidationError("OTP not found or expired");
  }

  // Check if OTP is expired
  if (new Date() > otpRecord.expiresAt) {
    await Otp.deleteOne({ _id: otpRecord._id });
    throw new ValidationError("OTP has expired");
  }

  // Verify OTP hash
  const isValidOtp = await bcrypt.compare(otp, otpRecord.otpHash);
  if (!isValidOtp) {
    throw new ValidationError("Invalid OTP");
  }

  // Find user and update password
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    throw new NotFoundError("User");
  }

  const password_hash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  user.password_hash = password_hash;
  await user.save();

  // Delete OTP record
  await Otp.deleteOne({ _id: otpRecord._id });

  return { success: true, message: "Password reset successful" };
};

/**
 * Verify user token
 */
export const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { valid: true, decoded };
  } catch (error) {
    return { valid: false, error: error.message };
  }
};

export default {
  signup,
  login,
  requestPasswordResetOtp,
  resetPasswordWithOtp,
  verifyToken,
  createToken,
  formatUserResponse,
};
