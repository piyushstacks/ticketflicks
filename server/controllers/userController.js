/**
 * User Controller
 * Handles user profile, favorites, and bookings
 * Business logic delegated to userService
 */

import userService from "../services/userService.js";
import { asyncHandler } from "../middleware/errorHandler.js";

/**
 * Get user's bookings
 */
export const fetchUserBookings = asyncHandler(async (req, res) => {
  const bookings = await userService.getUserBookings(req.user.id);
  res.json({ success: true, bookings });
});

/**
 * Get user profile
 */
export const getUserProfile = asyncHandler(async (req, res) => {
  const profile = await userService.getUserProfile(req.user.id);
  res.json({ success: true, user: profile });
});

/**
 * Update user profile
 */
export const updateUserProfile = asyncHandler(async (req, res) => {
  const { name, email, phone } = req.body;
  const updatedUser = await userService.updateUserProfile(req.user.id, {
    name,
    email,
    phone,
  });
  res.json({
    success: true,
    message: "Profile updated successfully",
    user: updatedUser,
  });
});

/**
 * Add movie to favorites
 */
export const addToFavorites = asyncHandler(async (req, res) => {
  const { movieId } = req.body;
  const result = await userService.addFavorite(req.user.id, movieId);
  res.json(result);
});

/**
 * Remove movie from favorites
 */
export const removeFromFavorites = asyncHandler(async (req, res) => {
  const { movieId } = req.body;
  const result = await userService.removeFavorite(req.user.id, movieId);
  res.json(result);
});

/**
 * Toggle favorite status
 */
export const updateFavorite = asyncHandler(async (req, res) => {
  const { movieId } = req.body;
  const result = await userService.toggleFavorite(req.user.id, movieId);
  res.json(result);
});

/**
 * Get user's favorite movies
 */
export const fetchFavorites = asyncHandler(async (req, res) => {
  const movies = await userService.getFavorites(req.user.id);
  res.json({ success: true, movies });
});

/**
 * Check if user is admin
 */
export const checkIsAdmin = asyncHandler(async (req, res) => {
  const isAdmin = req.user && req.user.role === "admin";
  res.json({ success: true, isAdmin });
});

/**
 * Get all users (admin only)
 */
export const getAllUsers = asyncHandler(async (req, res) => {
  const { skip = 0, limit = 50 } = req.query;
  const result = await userService.getAllUsers(
    parseInt(skip) || 0,
    parseInt(limit) || 50
  );
  res.json({ success: true, ...result });
});

// Alias exports for route compatibility
export const getUserFavorites = fetchFavorites;
export const updateUserFavorites = updateFavorite;
export const updateUser = updateUserProfile;

export default {
  fetchUserBookings,
  getUserProfile,
  updateUserProfile,
  addToFavorites,
  removeFromFavorites,
  updateFavorite,
  fetchFavorites,
  checkIsAdmin,
  getAllUsers,
  getUserFavorites,
  updateUserFavorites,
  updateUser,
};
