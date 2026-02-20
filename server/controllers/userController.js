import Booking from "../models/Booking.js";
import Movie from "../models/Movie.js";
import User from "../models/User.js";

export const fetchUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate({ path: "show", populate: { path: "movie" } })
      .sort({ createdAt: -1 });

    res.json({ success: true, bookings });
  } catch (error) {
    console.error("[fetchUserBookings]", error);
    res.json({ success: false, message: error.message });
  }
};

export const updateFavorite = async (req, res) => {
  try {
    const { movieId } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    if (!Array.isArray(user.favorites)) {
      user.favorites = [];
    }

    let actionType = "";

    if (!user.favorites.includes(movieId)) {
      const movieExists = await Movie.findById(movieId);
      if (!movieExists) {
        return res.json({ success: false, message: "Invalid Movie ID" });
      }

      user.favorites.push(movieId);
      actionType = "added";
    } else {
      user.favorites = user.favorites.filter((item) => item !== movieId);
      actionType = "removed";
    }

    await user.save();

    res.json({
      success: true,
      message: `Favorite movie ${actionType} successfully.`,
    });
  } catch (error) {
    console.error("[updateFavorite]", error);
    res.json({ success: false, message: error.message });
  }
};

export const fetchFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !Array.isArray(user.favorites)) {
      return res.json({ success: true, movies: [] });
    }
    const favorites = user.favorites;

    const movies = await Movie.find({ _id: { $in: favorites } });

    res.json({ success: true, movies });
  } catch (error) {
    console.error("[fetchFavorites] ", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    // Update fields if provided
    if (name) user.name = name;
    if (email && user.email !== email) {
      // Check if new email already exists for another user
      const existingUserWithEmail = await User.findOne({ email });
      if (existingUserWithEmail && existingUserWithEmail._id.toString() !== userId) {
        return res.json({ success: false, message: "Email already in use by another account" });
      }
      user.email = email;
    }
    if (phone) user.phone = phone;

    await user.save();

    // Return updated user data, excluding sensitive info
    const updatedUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      managedTheatreId: user.managedTheatreId,
    };

    res.json({ success: true, message: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    console.error("[updateUserProfile]", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
