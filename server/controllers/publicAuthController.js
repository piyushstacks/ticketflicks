import bcrypt from "bcryptjs";
import User from "../models/User.js";

// Regex: at least 1 lowercase, 1 uppercase, 1 digit, 1 special char
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// Validate password strength
const validatePassword = (password) => {
  if (!password || password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters long" };
  }
  if (!PASSWORD_REGEX.test(password)) {
    return { valid: false, message: "Password must contain at least 1 uppercase, 1 lowercase, 1 digit, and 1 special character (@$!%*?&)" };
  }
  return { valid: true };
};

// Public change password (no login required) - requires email + current password
export const publicChangePassword = async (req, res) => {
  try {
    const { email, currentPassword, newPassword, confirmPassword } = req.body;

    console.log("[publicChangePassword] Request received for email:", email);

    if (!email || !currentPassword || !newPassword || !confirmPassword) {
      console.log("[publicChangePassword] Missing fields:", { email: !!email, currentPassword: !!currentPassword, newPassword: !!newPassword, confirmPassword: !!confirmPassword });
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    if (newPassword !== confirmPassword) {
      console.log("[publicChangePassword] New passwords do not match");
      return res.status(400).json({ success: false, message: "New passwords do not match" });
    }

    // Validate new password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      console.log("[publicChangePassword] New password validation failed:", passwordValidation.message);
      return res.status(400).json({ success: false, message: passwordValidation.message });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.log("[publicChangePassword] User not found for email:", email);
      return res.status(400).json({ success: false, message: "No account found with this email" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      console.log("[publicChangePassword] Current password incorrect for email:", email);
      return res.status(400).json({ success: false, message: "Current password is incorrect" });
    }

    user.password_hash = await bcrypt.hash(newPassword, 10);
    await user.save();

    console.log("[publicChangePassword] Password updated successfully for email:", email);
    res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error("[publicChangePassword] Unexpected error:", error);
    
    // Handle specific error cases
    if (error.name === 'CastError') {
      console.log("[publicChangePassword] CastError:", error.message);
      return res.status(400).json({
        success: false,
        message: "Invalid user data. Please try again."
      });
    }
    
    if (error.message && error.message.includes('timeout')) {
      console.log("[publicChangePassword] Timeout error:", error.message);
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
