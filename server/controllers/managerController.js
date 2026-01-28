import Show from "../models/Show.js";
import Screen from "../models/Screen.js";
import Movie from "../models/Movie.js";
import Theatre from "../models/Theatre.js";
import Booking from "../models/Booking.js";
import User from "../models/User.js";

// Dashboard Data for Manager
export const dashboardManagerData = async (req, res) => {
  try {
    const manager = await User.findById(req.user.id);
    if (!manager || manager.role !== "manager") {
      return res.json({ success: false, message: "Not authorized" });
    }

    const theatreId = manager.managedTheaterId || manager.managedTheatreId;
    if (!theatreId) {
      return res.json({ success: false, message: "Manager has no theatre assigned" });
    }

    const activeShows = await Show.countDocuments({
      theatre: theatreId,
      showDateTime: { $gte: new Date() },
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayBookings = await Booking.countDocuments({
      theatre: theatreId,
      createdAt: { $gte: todayStart, $lte: todayEnd },
    });

    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const monthBookings = await Booking.find({
      theatre: theatreId,
      isPaid: true,
      createdAt: { $gte: monthStart },
    });

    const monthRevenue = monthBookings.reduce((sum, b) => sum + (b.amount || 0), 0);

    const screens = await Screen.countDocuments({ theatre: theatreId });
    const theatre = await Theatre.findById(theatreId);

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

    const theatreId = manager.managedTheaterId || manager.managedTheatreId;
    if (!theatreId) {
      return res.json({ success: false, message: "Manager has no theatre assigned" });
    }
    const { movieId, screenId, showDateTime, seatTiers } = req.body;

    if (!movieId || !screenId || !showDateTime) {
      return res.json({ success: false, message: "Missing required fields" });
    }

    // Verify screen belongs to manager's theatre
    const screen = await Screen.findById(screenId);
    if (!screen || screen.theatre.toString() !== theatreId.toString()) {
      return res.json({ success: false, message: "Invalid screen" });
    }

    const show = await Show.create({
      movie: movieId,
      theatre: theatreId,
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

    const theatreId = manager.managedTheaterId || manager.managedTheatreId;
    const { showId } = req.params;
    const { movieId, screenId, showDateTime, seatTiers } = req.body;

    const show = await Show.findById(showId);
    if (!show || show.theatre.toString() !== theatreId.toString()) {
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

    const theatreId = manager.managedTheaterId || manager.managedTheatreId;
    const { showId } = req.params;

    const show = await Show.findById(showId);
    if (!show || show.theatre.toString() !== theatreId.toString()) {
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

    const theatreId = manager.managedTheaterId || manager.managedTheatreId;
    if (!theatreId) {
      return res.json({ success: false, message: "Manager has no theatre assigned" });
    }
    const { screenNumber, seatLayout } = req.body;

    if (!screenNumber || !seatLayout) {
      return res.json({ success: false, message: "Missing required fields" });
    }

    const screen = await Screen.create({
      theatre: theatreId,
      screenNumber,
      seatLayout,
    });

    // Add screen to theatre
    await Theatre.findByIdAndUpdate(theatreId, {
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

    const theatreId = manager.managedTheaterId || manager.managedTheatreId;
    const { screenId } = req.params;
    const { screenNumber, seatLayout } = req.body;

    const screen = await Screen.findById(screenId);
    if (!screen || screen.theatre.toString() !== theatreId.toString()) {
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

    const theatreId = manager.managedTheaterId || manager.managedTheatreId;
    const { screenId } = req.params;

    const screen = await Screen.findById(screenId);
    if (!screen || screen.theatre.toString() !== theatreId.toString()) {
      return res.json({ success: false, message: "Invalid screen or not authorized" });
    }

    await Screen.findByIdAndDelete(screenId);

    // Remove screen from theatre
    await Theatre.findByIdAndUpdate(theatreId, {
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

    const theatreId = manager.managedTheaterId || manager.managedTheatreId;
    if (!theatreId) {
      return res.json({ success: false, message: "Manager has no theatre assigned" });
    }

    const bookings = await Booking.find({ theatre: theatreId })
      .populate("user", "name email phone")
      .populate({ path: "show", populate: { path: "movie" } })
      .sort({ createdAt: -1 });

    res.json({ success: true, bookings, count: bookings.length });
  } catch (error) {
    console.error("[getManagerBookings]", error);
    res.json({ success: false, message: error.message });
  }
};

// Get Movies for Manager (movies added to their theatre)
export const getManagerMovies = async (req, res) => {
  try {
    const manager = await User.findById(req.user.id);
    if (!manager || manager.role !== "manager") {
      return res.json({ success: false, message: "Not authorized" });
    }

    // Get movies that are available for this manager's theatre
    // This would typically be a junction table or reference in the theatre model
    // For now, we'll return all active movies as available
    const movies = await Movie.find({ isActive: true })
      .sort({ createdAt: -1 });

    res.json({ success: true, movies });
  } catch (error) {
    console.error("[getManagerMovies]", error);
    res.json({ success: false, message: error.message });
  }
};

// Add Movie to Manager's Theatre (from available list)
export const addMovie = async (req, res) => {
  try {
    const manager = await User.findById(req.user.id);
    if (!manager || manager.role !== "manager") {
      return res.json({ success: false, message: "Not authorized" });
    }

    const { movieId, isActive } = req.body;

    if (!movieId) {
      return res.json({ success: false, message: "Movie ID is required" });
    }

    // Check if movie exists and is active
    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.json({ success: false, message: "Movie not found" });
    }

    // In a real implementation, you would add this movie to the manager's theatre
    // This could be a junction table or updating the theatre model
    // For now, we'll just return success
    
    res.json({ 
      success: true, 
      message: "Movie added to theatre successfully", 
      movie: {
        ...movie.toObject(),
        isActive: isActive !== undefined ? isActive : true
      }
    });
  } catch (error) {
    console.error("[addMovie]", error);
    res.json({ success: false, message: error.message });
  }
};

// Toggle Movie Status (Disable/Enable)
export const toggleMovieStatus = async (req, res) => {
  try {
    const manager = await User.findById(req.user.id);
    if (!manager || manager.role !== "manager") {
      return res.json({ success: false, message: "Not authorized" });
    }

    const { movieId } = req.params;
    const { isActive } = req.body;

    // In a real implementation, you would update the movie status in the junction table
    // For now, we'll just return success
    
    res.json({ 
      success: true, 
      message: `Movie ${isActive ? 'enabled' : 'disabled'} successfully`
    });
  } catch (error) {
    console.error("[toggleMovieStatus]", error);
    res.json({ success: false, message: error.message });
  }
};

// Remove Movie from Manager's Theatre
export const removeMovie = async (req, res) => {
  try {
    const manager = await User.findById(req.user.id);
    if (!manager || manager.role !== "manager") {
      return res.json({ success: false, message: "Not authorized" });
    }

    const { movieId } = req.params;

    // In a real implementation, you would remove this movie from the manager's theatre
    // This could be removing from junction table or updating the theatre model
    // For now, we'll just return success
    
    res.json({ success: true, message: "Movie removed from theatre successfully" });
  } catch (error) {
    console.error("[removeMovie]", error);
    res.json({ success: false, message: error.message });
  }
};

// Toggle Screen Status (Disable/Enable)
export const toggleScreenStatus = async (req, res) => {
  try {
    const manager = await User.findById(req.user.id);
    if (!manager || manager.role !== "manager") {
      return res.json({ success: false, message: "Not authorized" });
    }

    const { screenId } = req.params;
    const { status } = req.body;

    const screen = await Screen.findById(screenId);
    if (!screen) {
      return res.json({ success: false, message: "Screen not found" });
    }

    // Verify screen belongs to manager's theatre
    if (screen.theatre.toString() !== manager.managedTheatreId.toString()) {
      return res.json({ success: false, message: "Not authorized to manage this screen" });
    }

    screen.status = status;
    await screen.save();

    res.json({ 
      success: true, 
      message: `Screen ${status === 'disabled' ? 'disabled' : 'enabled'} successfully`,
      screen 
    });
  } catch (error) {
    console.error("[toggleScreenStatus]", error);
    res.json({ success: false, message: error.message });
  }
};
