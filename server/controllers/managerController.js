import Show from "../models/Show.js";
import Screen from "../models/Screen.js";
import Movie from "../models/Movie.js";
import Theater from "../models/Theater.js";
import Booking from "../models/Booking.js";
import User from "../models/User.js";

// Dashboard Data for Manager
export const dashboardManagerData = async (req, res) => {
  try {
    const manager = await User.findById(req.user.id);
    if (!manager || manager.role !== "manager") {
      return res.json({ success: false, message: "Not authorized" });
    }

    const theatreId = manager.managedTheaterId;

    const activeShows = await Show.countDocuments({
      theater: theatreId,
      showDateTime: { $gte: new Date() },
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayBookings = await Booking.countDocuments({
      theater: theatreId,
      createdAt: { $gte: todayStart, $lte: todayEnd },
    });

    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const monthBookings = await Booking.find({
      theater: theatreId,
      isPaid: true,
      createdAt: { $gte: monthStart },
    });

    const monthRevenue = monthBookings.reduce((sum, b) => sum + (b.amount || 0), 0);

    const screens = await Screen.countDocuments({ theater: theatreId });
    const theatre = await Theater.findById(theatreId);

    res.json({
      success: true,
      data: {
        activeShows,
        todayBookings,
        monthRevenue,
        screens,
        theatreName: theatre?.name || "N/A",
        theatreId,
      },
    });
  } catch (error) {
    console.error("[dashboardManagerData]", error);
    res.json({ success: false, message: error.message });
  }
};

// Add Show
export const addShow = async (req, res) => {
  try {
    const manager = await User.findById(req.user.id);
    if (!manager || manager.role !== "manager") {
      return res.json({ success: false, message: "Not authorized" });
    }

    const theatreId = manager.managedTheaterId;
    const { movieId, screenId, showDateTime, seatTiers } = req.body;

    if (!movieId || !screenId || !showDateTime) {
      return res.json({ success: false, message: "Missing required fields" });
    }

    // Verify screen belongs to manager's theatre
    const screen = await Screen.findById(screenId);
    if (!screen || screen.theater.toString() !== theatreId.toString()) {
      return res.json({ success: false, message: "Invalid screen" });
    }

    const show = await Show.create({
      movie: movieId,
      theater: theatreId,
      screen: screenId,
      showDateTime,
      seatTiers: seatTiers || [],
      totalCapacity: screen.seatLayout?.totalSeats || 200,
      occupiedSeatsCount: 0,
    });

    res.json({ success: true, message: "Show added successfully", show });
  } catch (error) {
    console.error("[addShow]", error);
    res.json({ success: false, message: error.message });
  }
};

// Edit Show
export const editShow = async (req, res) => {
  try {
    const manager = await User.findById(req.user.id);
    if (!manager || manager.role !== "manager") {
      return res.json({ success: false, message: "Not authorized" });
    }

    const { showId } = req.params;
    const { movieId, screenId, showDateTime, seatTiers } = req.body;

    const show = await Show.findById(showId);
    if (!show || show.theater.toString() !== manager.managedTheaterId.toString()) {
      return res.json({ success: false, message: "Invalid show or not authorized" });
    }

    const updateData = {};
    if (movieId) updateData.movie = movieId;
    if (screenId) updateData.screen = screenId;
    if (showDateTime) updateData.showDateTime = showDateTime;
    if (seatTiers) updateData.seatTiers = seatTiers;

    const updatedShow = await Show.findByIdAndUpdate(showId, updateData, { new: true })
      .populate("movie")
      .populate("screen");

    res.json({ success: true, message: "Show updated successfully", show: updatedShow });
  } catch (error) {
    console.error("[editShow]", error);
    res.json({ success: false, message: error.message });
  }
};

// Delete Show
export const deleteShow = async (req, res) => {
  try {
    const manager = await User.findById(req.user.id);
    if (!manager || manager.role !== "manager") {
      return res.json({ success: false, message: "Not authorized" });
    }

    const { showId } = req.params;

    const show = await Show.findById(showId);
    if (!show || show.theater.toString() !== manager.managedTheaterId.toString()) {
      return res.json({ success: false, message: "Invalid show or not authorized" });
    }

    await Show.findByIdAndDelete(showId);

    res.json({ success: true, message: "Show deleted successfully" });
  } catch (error) {
    console.error("[deleteShow]", error);
    res.json({ success: false, message: error.message });
  }
};

// Add Screen
export const addScreen = async (req, res) => {
  try {
    const manager = await User.findById(req.user.id);
    if (!manager || manager.role !== "manager") {
      return res.json({ success: false, message: "Not authorized" });
    }

    const theatreId = manager.managedTheaterId;
    const { screenNumber, seatLayout } = req.body;

    if (!screenNumber || !seatLayout) {
      return res.json({ success: false, message: "Missing required fields" });
    }

    const screen = await Screen.create({
      theater: theatreId,
      screenNumber,
      seatLayout,
    });

    // Add screen to theatre
    await Theater.findByIdAndUpdate(theatreId, {
      $push: { screens: screen._id },
    });

    res.json({ success: true, message: "Screen added successfully", screen });
  } catch (error) {
    console.error("[addScreen]", error);
    res.json({ success: false, message: error.message });
  }
};

// Edit Screen
export const editScreen = async (req, res) => {
  try {
    const manager = await User.findById(req.user.id);
    if (!manager || manager.role !== "manager") {
      return res.json({ success: false, message: "Not authorized" });
    }

    const { screenId } = req.params;
    const { screenNumber, seatLayout } = req.body;

    const screen = await Screen.findById(screenId);
    if (!screen || screen.theater.toString() !== manager.managedTheaterId.toString()) {
      return res.json({ success: false, message: "Invalid screen or not authorized" });
    }

    const updateData = {};
    if (screenNumber) updateData.screenNumber = screenNumber;
    if (seatLayout) updateData.seatLayout = seatLayout;

    const updatedScreen = await Screen.findByIdAndUpdate(screenId, updateData, { new: true });

    res.json({ success: true, message: "Screen updated successfully", screen: updatedScreen });
  } catch (error) {
    console.error("[editScreen]", error);
    res.json({ success: false, message: error.message });
  }
};

// Delete Screen
export const deleteScreen = async (req, res) => {
  try {
    const manager = await User.findById(req.user.id);
    if (!manager || manager.role !== "manager") {
      return res.json({ success: false, message: "Not authorized" });
    }

    const { screenId } = req.params;

    const screen = await Screen.findById(screenId);
    if (!screen || screen.theater.toString() !== manager.managedTheaterId.toString()) {
      return res.json({ success: false, message: "Invalid screen or not authorized" });
    }

    await Screen.findByIdAndDelete(screenId);

    // Remove screen from theatre
    await Theater.findByIdAndUpdate(manager.managedTheaterId, {
      $pull: { screens: screenId },
    });

    res.json({ success: true, message: "Screen deleted successfully" });
  } catch (error) {
    console.error("[deleteScreen]", error);
    res.json({ success: false, message: error.message });
  }
};

// Get Manager Bookings
export const getManagerBookings = async (req, res) => {
  try {
    const manager = await User.findById(req.user.id);
    if (!manager || manager.role !== "manager") {
      return res.json({ success: false, message: "Not authorized" });
    }

    const bookings = await Booking.find({
      theater: manager.managedTheaterId,
    })
      .populate("user", "name email phone")
      .populate({
        path: "show",
        populate: { path: "movie" },
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, bookings, count: bookings.length });
  } catch (error) {
    console.error("[getManagerBookings]", error);
    res.json({ success: false, message: error.message });
  }
};

// Add Movie to Theatre
export const addMovie = async (req, res) => {
  try {
    const manager = await User.findById(req.user.id);
    if (!manager || manager.role !== "manager") {
      return res.json({ success: false, message: "Not authorized" });
    }

    const { title, poster_path, overview, genres, runtime, release_date, vote_average } = req.body;

    if (!title) {
      return res.json({ success: false, message: "Missing required fields" });
    }

    const movie = await Movie.create({
      title,
      poster_path: poster_path || "",
      overview: overview || "",
      genres: genres || [],
      runtime: runtime || 0,
      release_date: release_date || new Date(),
      vote_average: vote_average || 0,
    });

    res.json({ success: true, message: "Movie added successfully", movie });
  } catch (error) {
    console.error("[addMovie]", error);
    res.json({ success: false, message: error.message });
  }
};

// Edit Movie
export const editMovie = async (req, res) => {
  try {
    const manager = await User.findById(req.user.id);
    if (!manager || manager.role !== "manager") {
      return res.json({ success: false, message: "Not authorized" });
    }

    const { movieId } = req.params;
    const { title, poster_path, overview, genres, runtime, release_date, vote_average } = req.body;

    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.json({ success: false, message: "Movie not found" });
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (poster_path) updateData.poster_path = poster_path;
    if (overview) updateData.overview = overview;
    if (genres) updateData.genres = genres;
    if (runtime) updateData.runtime = runtime;
    if (release_date) updateData.release_date = release_date;
    if (vote_average) updateData.vote_average = vote_average;

    const updatedMovie = await Movie.findByIdAndUpdate(movieId, updateData, { new: true });

    res.json({ success: true, message: "Movie updated successfully", movie: updatedMovie });
  } catch (error) {
    console.error("[editMovie]", error);
    res.json({ success: false, message: error.message });
  }
};

// Delete Movie
export const deleteMovie = async (req, res) => {
  try {
    const manager = await User.findById(req.user.id);
    if (!manager || manager.role !== "manager") {
      return res.json({ success: false, message: "Not authorized" });
    }

    const { movieId } = req.params;

    await Movie.findByIdAndDelete(movieId);

    res.json({ success: true, message: "Movie deleted successfully" });
  } catch (error) {
    console.error("[deleteMovie]", error);
    res.json({ success: false, message: error.message });
  }
};
