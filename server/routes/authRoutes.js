import express from "express";
import {
	login,
	signup,
	forgotPasswordRequest,
	resetPasswordWithOtp,
	changePassword,
 	resendForgotOtp,
} from "../controllers/authController.js";
import { publicChangePassword } from "../controllers/publicAuthController.js";
import { protectUser } from "../middleware/protectUser.js";
import { otpRateLimiter } from "../middleware/otpRateLimiter.js";

const authRouter = express.Router();

authRouter.post("/signup", signup);
authRouter.post("/login", login); // Direct password-based login (no OTP)

// Forgot/reset password (OTP required)
authRouter.post("/forgot-password", otpRateLimiter(), forgotPasswordRequest);
authRouter.post("/forgot-password/resend", otpRateLimiter(), (req, res) => resendForgotOtp(req, res));
authRouter.post("/reset-password", resetPasswordWithOtp);

// Change password (authenticated)
authRouter.post("/change-password", protectUser, changePassword);

// Public change password (no login required)
authRouter.post("/public/change-password", publicChangePassword);

export default authRouter;

