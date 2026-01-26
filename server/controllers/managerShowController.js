import Show from "../models/Show.js";
import Screen from "../models/Screen.js";
import Movie from "../models/Movie.js";
import Theater from "../models/Theater.js";
import User from "../models/User.js";

// Get available movies for this manager's theatre
export const getAvailableMovies = async (req, res) => {
  try {
    const manager = await User.findById(req.user.id);
    if (!manager || manager.role !== "manager") {
      return res.json({
        success: false,
        message: "Unauthorized - Manager access required",
      });
    }

    const movies = await Movie.find({ isActive: true }).select(
      "title overview poster_path backdrop_path release_date vote_average runtime genres original_language _id"
    );

    res.json({ success: true, movies });
  } catch (error) {
    console.error("[getAvailableMovies]", error);
    res.json({ success: false, message: error.message });
  }
};

// Get screens for manager's theatre
export const getTheatreScreens = async (req, res) => {
  try {
    const manager = await User.findById(req.user.id);
    if (!manager || manager.role !== "manager") {
      return res.json({
        success: false,
        message: "Unauthorized - Manager access required",
      });
    }

    const theatreId = manager.managedTheaterId;

    const screens = await Screen.find({
      theater: theatreId,
    }).populate("theater", "name");

    res.json({ success: true, screens });
  } catch (error) {
    console.error("[getTheatreScreens]", error);
    res.json({ success: false, message: error.message });
  }
};

// Add new show
export const addShow = async (req, res) => {
  try {
    const manager = await User.findById(req.user.id);
    if (!manager || manager.role !== "manager") {
      return res.json({
        success: false,
        message: "Unauthorized - Manager access required",
      });
    }

    const theatreId = manager.managedTheaterId;
    const { movieId, screenId, showDateTime, language } = req.body;

    if (!movieId || !screenId || !showDateTime) {
      return res.json({
        success: false,
        message: "Movie ID, Screen ID, and Show Date/Time are required",
      });
    }

    // Validate movie exists and is active
    const movie = await Movie.findOne({ _id: movieId, isActive: true });
    if (!movie) {
      return res.json({
        success: false,
        message: "Movie not found or is inactive",
      });
    }

    // Validate screen exists and belongs to this theatre
    const screen = await Screen.findOne({
      _id: screenId,
      theater: theatreId,
    });
    if (!screen) {
      return res.json({
        success: false,
        message: "Screen not found for this theatre",
      });
    }

    // Check if show already exists for this time slot
    const existingShow = await Show.findOne({
      movie: movieId,
      screen: screenId,
      showDateTime: new Date(showDateTime),
    });

    if (existingShow) {
      return res.json({
        success: false,
        message: "Show already exists for this time slot",
      });
    }

    // Use default base price
    const basePrice = 150;

    // Create seat tiers with default pricing
    const seatTiers = [
      {
        tierName: "Standard",
        price: basePrice,
        seatsPerRow: screen.seatsPerRow || 20,
        rowCount: screen.rows || 10,
        totalSeats: (screen.seatsPerRow || 20) * (screen.rows || 10),
        occupiedSeats: {},
      },
      {
        tierName: "Premium",
        price: Math.round(basePrice * 1.5),
        seatsPerRow: 5,
        rowCount: 2,
        totalSeats: 10,
        occupiedSeats: {},
      },
    ];

    const totalCapacity = seatTiers.reduce(
      (sum, tier) => sum + tier.totalSeats,
      0
    );

    const show = await Show.create({
      movie: movieId,
      theater: theatreId,
      screen: screenId,
      showDateTime: new Date(showDateTime),
      basePrice,
      language: language || "en",
      seatTiers,
      totalCapacity,
      occupiedSeatsCount: 0,
      isActive: true,
    });

    const populatedShow = await show.populate("movie screen");

    res.json({
      success: true,
      message: "Show added successfully",
      show: populatedShow,
    });
  } catch (error) {
    console.error("[addShow]", error);
    res.json({ success: false, message: error.message });
  }
};

// Get all shows for manager's theatre
export const getTheatreShows = async (req, res) => {
  try {
    const manager = await User.findById(req.user.id);
    if (!manager || manager.role !== "manager") {
      return res.json({
        success: false,
        message: "Unauthorized - Manager access required",
      });
    }

    const theatreId = manager.managedTheaterId;
    const { movieId, status = "all" } = req.query;

    let query = { theater: theatreId };

    if (movieId) {
      query.movie = movieId;
    }

    if (status === "upcoming") {
      query.showDateTime = { $gte: new Date() };
    } else if (status === "past") {
      query.showDateTime = { $lt: new Date() };
    }

    const shows = await Show.find(query)
      .populate("movie", "title poster_path")
      .populate("screen", "screenNumber")
      .sort({ showDateTime: -1 });

    res.json({ success: true, shows });
  } catch (error) {
    console.error("[getTheatreShows]", error);
    res.json({ success: false, message: error.message });
  }
};

// Edit show
export const editShow = async (req, res) => {
  try {
    const manager = await User.findById(req.user.id);
    if (!manager || manager.role !== "manager") {
      return res.json({
        success: false,
        message: "Unauthorized - Manager access required",
      });
    }

    const theatreId = manager.managedTheaterId;
    const { showId } = req.params;
    const updates = req.body;

    // Ensure show belongs to manager's theatre
    const show = await Show.findOne({
      _id: showId,
      theater: theatreId,
    });

    if (!show) {
      return res.json({
        success: false,
        message: "Show not found for this theatre",
      });
    }

    const updatedShow = await Show.findByIdAndUpdate(showId, updates, {
      new: true,
    }).populate("movie screen");

    res.json({
      success: true,
      message: "Show updated successfully",
      show: updatedShow,
    });
  } catch (error) {
    console.error("[editShow]", error);
    res.json({ success: false, message: error.message });
  }
};

// Delete show
export const deleteShow = async (req, res) => {
  try {
    const manager = await User.findById(req.user.id);
    if (!manager || manager.role !== "manager") {
      return res.json({
        success: false,
        message: "Unauthorized - Manager access required",
      });
    }

    const theatreId = manager.managedTheaterId;
    const { showId } = req.params;

    const show = await Show.findOne({
      _id: showId,
      theater: theatreId,
    });

    if (!show) {
      return res.json({
        success: false,
        message: "Show not found for this theatre",
      });
    }

    await Show.findByIdAndDelete(showId);

    res.json({
      success: true,
      message: "Show deleted successfully",
    });
  } catch (error) {
    console.error("[deleteShow]", error);
    res.json({ success: false, message: error.message });
  }
};

// Dashboard data
export const dashboardManagerData = async (req, res) => {
  try {
    const manager = await User.findById(req.user.id);
    if (!manager || manager.role !== "manager") {
      return res.json({
        success: false,
        message: "Unauthorized - Manager access required",
      });
    }

    const theatreId = manager.managedTheaterId;

    const activeShows = await Show.countDocuments({
      theater: theatreId,
      showDateTime: { $gte: new Date() },
      isActive: true,
    });

    const totalShows = await Show.countDocuments({
      theater: theatreId,
    });

    const theatre = await Theater.findById(theatreId);

    res.json({
      success: true,
      data: {
        activeShows,
        totalShows,
        theatreName: theatre?.name || "N/A",
        theatreCity: theatre?.city || "N/A",
        theatreId,
      },
    });
  } catch (error) {
    console.error("[dashboardManagerData]", error);
    res.json({ success: false, message: error.message });
  }
};
