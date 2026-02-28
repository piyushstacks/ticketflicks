/**
 * User service
 * Handles user profile, favorites, bookings
 */

import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Movie from "../models/Movie.js";
import { NotFoundError, ValidationError } from "./errorService.js";
import { validateEmail, validatePhone } from "./validationService.js";

/**
 * Get user profile by ID
 */
export const getUserProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError("User");
  }
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    managedTheatreId: user.managedTheatreId,
    createdAt: user.createdAt,
  };
};

/**
 * Update user profile
 */
export const updateUserProfile = async (userId, updateData) => {
  const { name, email, phone } = updateData;

  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError("User");
  }

  // Validate email if provided
  if (email && user.email !== email) {
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      throw new ValidationError(emailValidation.message);
    }

    // Check if new email is already in use
    const existingUser = await User.findOne({
      email: email.toLowerCase(),
      _id: { $ne: userId },
    });
    if (existingUser) {
      throw new ValidationError("Email already in use");
    }

    user.email = email.toLowerCase().trim();
  }

  // Validate phone if provided
  if (phone) {
    const phoneValidation = validatePhone(phone);
    if (!phoneValidation.valid) {
      throw new ValidationError(phoneValidation.message);
    }
    user.phone = phone;
  }

  // Validate name if provided
  if (name) {
    if (name.length < 2) {
      throw new ValidationError("Name must be at least 2 characters");
    }
    user.name = name.trim();
  }

  await user.save();

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
 * Add movie to user's favorites
 */
export const addFavorite = async (userId, movieId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError("User");
  }

  // Verify movie exists
  const movie = await Movie.findById(movieId);
  if (!movie) {
    throw new NotFoundError("Movie");
  }

  // Check if already favorited
  if (user.favorites && user.favorites.includes(movieId)) {
    return { success: true, message: "Already in favorites" };
  }

  // Add to favorites
  if (!Array.isArray(user.favorites)) {
    user.favorites = [];
  }
  user.favorites.push(movieId);
  await user.save();

  return { success: true, message: "Added to favorites" };
};

/**
 * Remove movie from user's favorites
 */
export const removeFavorite = async (userId, movieId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError("User");
  }

  // Remove from favorites
  if (Array.isArray(user.favorites)) {
    user.favorites = user.favorites.filter(
      (id) => id.toString() !== movieId.toString()
    );
    await user.save();
  }

  return { success: true, message: "Removed from favorites" };
};

/**
 * Toggle favorite status
 */
export const toggleFavorite = async (userId, movieId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError("User");
  }

  // Verify movie exists
  const movie = await Movie.findById(movieId);
  if (!movie) {
    throw new NotFoundError("Movie");
  }

  if (!Array.isArray(user.favorites)) {
    user.favorites = [];
  }

  const index = user.favorites.findIndex(
    (id) => id.toString() === movieId.toString()
  );
  const isFavorited = index !== -1;

  if (isFavorited) {
    user.favorites.splice(index, 1);
  } else {
    user.favorites.push(movieId);
  }

  await user.save();

  return {
    success: true,
    message: isFavorited ? "Removed from favorites" : "Added to favorites",
    isFavorited: !isFavorited,
  };
};

/**
 * Get user's favorite movies
 */
export const getFavorites = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError("User");
  }

  if (!Array.isArray(user.favorites) || user.favorites.length === 0) {
    return [];
  }

  const movies = await Movie.find({
    _id: { $in: user.favorites },
  }).select("title poster_path description release_date");

  return movies;
};

/**
 * Get user's bookings
 */
export const getUserBookings = async (userId) => {
  const bookings = await Booking.find({ user_id: userId })
    .populate({
      path: "show_id",
      populate: [
        { path: "movie", select: "title poster_path duration_min" },
        { path: "theatre", select: "name location city" },
        { path: "screen", select: "name" },
      ],
    })
    .sort({ createdAt: -1 });

  return bookings.map((booking) => ({
    id: booking._id.toString(),
    showId: booking.show_id._id.toString(),
    movie: booking.show_id.movie,
    theatre: booking.show_id.theatre,
    screen: booking.show_id.screen,
    showDateTime: booking.show_id.showDateTime,
    seats: booking.seats_booked,
    totalAmount: booking.total_amount,
    status: booking.status,
    paymentStatus: booking.payment_status,
    createdAt: booking.createdAt,
  }));
};

/**
 * Get all users (admin only)
 */
export const getAllUsers = async (skip = 0, limit = 50) => {
  const users = await User.find({}, { password_hash: 0 })
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await User.countDocuments();

  return {
    users: users.map((user) => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      lastLogin: user.last_login,
      createdAt: user.createdAt,
    })),
    pagination: {
      total,
      skip,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
};

export default {
  getUserProfile,
  updateUserProfile,
  addFavorite,
  removeFavorite,
  toggleFavorite,
  getFavorites,
  getUserBookings,
  getAllUsers,
};
