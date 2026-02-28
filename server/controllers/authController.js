/**
 * Authentication Controller
 * Handles signup, login, password reset, and OTP verification
 */

import authService from "../services/authService.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import Otp from "../models/Otp.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

/**
 * Sign up a new user
 */
export const signup = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;

  const result = await authService.signup({
    name,
    email,
    phone,
    password,
  });

  res.status(201).json({
    success: true,
    message: "Signup successful",
    token: result.token,
    user: result.user,
  });
});

/**
 * Login user
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const result = await authService.login({
    email,
    password,
  });

  res.json({
    success: true,
    message: "Login successful",
    token: result.token,
    user: result.user,
  });
});

/**
 * Request password reset OTP
 */
export const forgotPasswordRequest = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const result = await authService.requestPasswordResetOtp(email);

  res.json(result);
});

/**
 * Resend password reset OTP
 */
export const resendForgotOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const result = await authService.requestPasswordResetOtp(email);

  res.json(result);
});

/**
 * Reset password with OTP
 */
export const resetPasswordWithOtp = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const result = await authService.resetPasswordWithOtp(email, otp, newPassword);

  res.json(result);
});

/**
 * Change password (authenticated)
 */
export const changePassword = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: "New passwords do not match",
    });
  }

  // Get user with password hash
  const user = await User.findById(userId).select("+password_hash");
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: "Current password is incorrect",
    });
  }

  // Validate new password
  const passwordValidation = await authService.validatePassword(newPassword);
  if (!passwordValidation.valid) {
    return res.status(400).json({
      success: false,
      message: passwordValidation.message,
    });
  }

  user.password_hash = await bcrypt.hash(newPassword, 10);
  await user.save();

  res.json({
    success: true,
    message: "Password changed successfully",
  });
});

/**
 * Complete signup with OTP verification
 */
export const completeSignupWithOtp = asyncHandler(async (req, res) => {
  const { email, otp, name, phone, password } = req.body;

  if (!email || !otp || !name || !phone || !password) {
    return res.status(400).json({ 
      success: false, 
      message: "All fields are required" 
    });
  }

  // Find and verify OTP
  const otpDoc = await Otp.findOne({
    email: email.toLowerCase(),
    purpose: "signup",
    expiresAt: { $gte: new Date() }
  }).sort({ createdAt: -1 });

  if (!otpDoc) {
    return res.status(400).json({ 
      success: false, 
      message: "OTP not found or expired" 
    });
  }

  const match = await bcrypt.compare(otp, otpDoc.otpHash);
  if (!match) {
    return res.status(400).json({ 
      success: false, 
      message: "Invalid OTP" 
    });
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return res.status(400).json({ 
      success: false, 
      message: "Email already registered" 
    });
  }

  // Create user using authService
  const result = await authService.signup({
    name,
    email,
    phone,
    password,
  });

  // Delete OTP after successful signup
  await Otp.deleteOne({ _id: otpDoc._id });

  res.status(201).json({
    success: true,
    message: "Signup successful",
    token: result.token,
    user: result.user,
  });
});

export default {
  signup,
  login,
  forgotPasswordRequest,
  resendForgotOtp,
  resetPasswordWithOtp,
  changePassword,
  completeSignupWithOtp,
};
