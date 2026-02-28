import * as authService from "../services/authService.js";
import { asyncHandler, AppError } from "../services/errorService.js";

export const publicChangePassword = asyncHandler(async (req, res) => {
  const { email, currentPassword, newPassword, confirmPassword } = req.body;

  if (!email || !currentPassword || !newPassword || !confirmPassword) {
    throw new AppError("All fields are required", 400);
  }

  if (newPassword !== confirmPassword) {
    throw new AppError("New passwords do not match", 400);
  }

  await authService.changePassword(email, currentPassword, newPassword);
  res.json({ success: true, message: "Password changed successfully" });
});
