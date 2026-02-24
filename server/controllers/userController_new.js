import User from "../models/User_new.js";
import Otp from "../models/Otp.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import sendEmail from "../configs/nodeMailer.js";

const SIGNUP_OTP_TTL_MS = 10 * 60 * 1000;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// Register new user
export const registerUser = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    if (!name || !email || !phone || !password) {
      return res.json({
        success: false,
        message: "Please provide name, email, phone, and password",
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.json({ success: false, message: "Email already registered" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      phone,
      password_hash,
      role: role || "customer",
    });

    // Generate token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "User registered successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error("[registerUser]", error);
    res.json({ success: false, message: error.message });
  }
};

// Login user
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.json({ success: false, message: "Please provide email and password" });
    }

    // Find user with password
    const user = await User.findOne({ email }).select("+password_hash");
    if (!user) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    // Update last login
    user.last_login = new Date();
    await user.save();

    // Generate token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error("[loginUser]", error);
    res.json({ success: false, message: error.message });
  }
};

// Get user profile
export const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select("-password_hash");
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error("[getUserProfile]", error);
    res.json({ success: false, message: error.message });
  }
};

// Update user
export const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, phone, role } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (role) user.role = role;

    await user.save();

    res.json({
      success: true,
      message: "User updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("[updateUser]", error);
    res.json({ success: false, message: error.message });
  }
};

// Get all users (admin only)
export const getAllUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const query = {};
    if (role) query.role = role;

    const users = await User.find(query)
      .select("-password_hash")
      .sort({ createdAt: -1 });

    res.json({ success: true, users });
  } catch (error) {
    console.error("[getAllUsers]", error);
    res.json({ success: false, message: error.message });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("[deleteUser]", error);
    res.json({ success: false, message: error.message });
  }
};

// Request OTP for signup
export const requestSignupOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email is required" });

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    await Otp.deleteMany({ email: email.toLowerCase(), purpose: "signup" });

    const otp = ("000000" + Math.floor(Math.random() * 999999)).slice(-6);
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[dev-otp] signup OTP for ${email.toLowerCase()}: ${otp}`);
    }
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + SIGNUP_OTP_TTL_MS);

    await Otp.create({ email: email.toLowerCase(), otpHash, purpose: "signup", expiresAt });

    const subject = "Your email verification code";
    const body = `<p>Your verification code is <strong>${otp}</strong>. It expires in 10 minutes.</p>`;
    try {
      await sendEmail({ to: email, subject, body });
    } catch (err) {
      console.error("[requestSignupOtp][sendEmail]", err);
    }

    res.json({ success: true, message: "Verification code sent to your email" });
  } catch (error) {
    console.error("[requestSignupOtp]", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Complete signup with OTP
export const completeSignupWithOtp = async (req, res) => {
  try {
    const { email, otp, name, phone, password } = req.body;

    if (!email || !otp || !name || !phone || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    if (password.length < PASSWORD_MIN_LENGTH) {
      return res.status(400).json({ success: false, message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters` });
    }
    if (!PASSWORD_REGEX.test(password)) {
      return res.status(400).json({ success: false, message: "Password must contain uppercase, lowercase, digit, and special character" });
    }

    const otpDoc = await Otp.findOne({
      email: email.toLowerCase(),
      purpose: "signup",
      expiresAt: { $gte: new Date() }
    }).sort({ createdAt: -1 });

    if (!otpDoc) return res.status(400).json({ success: false, message: "OTP not found or expired" });

    const match = await bcrypt.compare(otp, otpDoc.otpHash);
    if (!match) return res.status(400).json({ success: false, message: "Invalid OTP" });

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

    await Otp.deleteMany({ email: email.toLowerCase(), purpose: "signup" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "Signup successful",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("[completeSignupWithOtp]", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export default {
  registerUser,
  loginUser,
  getUserProfile,
  updateUser,
  getAllUsers,
  deleteUser,
  requestSignupOtp,
  completeSignupWithOtp,
};

// Check if user is admin
export const checkIsAdmin = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.json({ success: false, isAdmin: false, message: "Not authenticated" });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.json({ success: false, isAdmin: false, message: "User not found" });
    }
    
    const isAdmin = user.role === "admin";
    res.json({ success: true, isAdmin });
  } catch (error) {
    console.error("[checkIsAdmin]", error);
    res.json({ success: false, isAdmin: false, message: error.message });
  }
};

// Get user favorites (placeholder - favorites not implemented in new schema yet)
export const getUserFavorites = async (req, res) => {
  try {
    // Favorites not yet implemented in new schema - return empty array
    res.json({ success: true, movies: [] });
  } catch (error) {
    console.error("[getUserFavorites]", error);
    res.json({ success: false, movies: [], message: error.message });
  }
};

// Update user favorites (placeholder)
export const updateUserFavorites = async (req, res) => {
  try {
    // Favorites not yet implemented in new schema
    res.json({ success: true, message: "Favorites not implemented yet" });
  } catch (error) {
    console.error("[updateUserFavorites]", error);
    res.json({ success: false, message: error.message });
  }
};
