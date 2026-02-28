import express from "express";
import {
  fetchFavorites,
  fetchUserBookings,
  updateFavorite,
  updateUserProfile,
} from "../controllers/userController.js";
import { protectUser } from "../middleware/protectUser.js";
import { submitFeedback } from "../controllers/feedbackController.js";
import {
  login,
  signup,
  forgotPasswordRequest,
  resetPasswordWithOtp,
  changePassword,
  resendForgotOtp,
  requestSignupOtp,
  completeSignupWithOtp,
} from "../controllers/authController.js";
import { otpRateLimiter } from "../middleware/otpRateLimiter.js";

// Create a more lenient rate limiter for forgot-password (10 per 15 minutes)
const forgotPasswordRateLimiter = otpRateLimiter({ windowMs: 15 * 60 * 1000, max: 10 });

const userRouter = express.Router();

userRouter.post("/signup", signup); // Direct signup (kept for compatibility)
userRouter.post("/login", login); // Direct password-based login (no OTP)

// New OTP-based signup flow
userRouter.post("/signup/request-otp", forgotPasswordRateLimiter, requestSignupOtp);
userRouter.post("/signup/complete", completeSignupWithOtp);

// Forgot password OTP flow (2-min expiry, resend deletes old OTP)
userRouter.post("/forgot-password", forgotPasswordRateLimiter, forgotPasswordRequest);
userRouter.post("/forgot-password/resend", forgotPasswordRateLimiter, (req, res) => resendForgotOtp(req, res));
userRouter.post("/reset-password", resetPasswordWithOtp);

// Authenticated routes
userRouter.get("/is-admin", protectUser, (req, res) => {
  res.json({ success: true, isAdmin: req.user?.role === "admin" });
});
userRouter.post("/change-password", protectUser, changePassword);
userRouter.put("/profile", protectUser, updateUserProfile);
userRouter.get("/bookings", protectUser, fetchUserBookings);
userRouter.post("/update-favorite", protectUser, updateFavorite);
userRouter.get("/favorites", protectUser, fetchFavorites);
userRouter.post("/submit-feedback", protectUser, submitFeedback);

export default userRouter;
