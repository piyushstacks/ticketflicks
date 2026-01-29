import Show from "../models/Show.js";
import ScreenTbl from "../models/ScreenTbl.js";
import Movie from "../models/Movie.js";
import Theatre from "../models/Theatre.js";
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

    const theatreId = manager.managedTheaterId || manager.managedTheatreId;
    
    if (!theatreId) {
      return res.json({
        success: false,
        message: "Manager has no theatre assigned"
      });
    }

    // Get all active movies and check theatre-specific status
    const movies = await Movie.find({
      isActive: true
    })
      .select(
        "title overview poster_path backdrop_path release_date vote_average runtime genres original_language isActive theatres excludedTheatres _id"
      )
      .sort({ createdAt: -1 });

    // Add theatre-specific status to each movie
    const moviesWithStatus = movies.map(movie => {
      const isTheatreExcluded = movie.excludedTheatres && movie.excludedTheatres.includes(theatreId);
      const isTheatreIncluded = movie.theatres && movie.theatres.includes(theatreId);
      
      // Movie is active for this theatre if:
      // 1. It's not in excludedTheatres AND
      // 2. Either it's in theatres array OR it's not explicitly managed (global availability)
      const isActiveForTheatre = !isTheatreExcluded && (isTheatreIncluded || movie.excludedTheatres.length === 0);
      
      return {
        ...movie.toObject(),
        isActive: isActiveForTheatre
      };
    });

    res.json({ success: true, movies: moviesWithStatus });
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

    const theatreId = manager.managedTheaterId || manager.managedTheatreId;

    const screens = await ScreenTbl.find({
      theatre: theatreId,
    }).populate("theatre", "name");

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

    const theatreId = manager.managedTheaterId || manager.managedTheatreId;
    const { 
      movie, 
      screen, 
      showTime, 
      language = "English", 
      startDate, 
      endDate, 
      isActive = true 
    } = req.body;

    if (!movie || !screen || !showTime) {
      return res.json({
        success: false,
        message: "Movie, Screen, and Show Time are required",
      });
    }

    // Validate movie exists and is active
    const movieDoc = await Movie.findOne({ _id: movie, isActive: true });
    if (!movieDoc) {
      return res.json({
        success: false,
        message: "Movie not found or is inactive",
      });
    }

    // Validate screen exists and belongs to this theatre
    const screenDoc = await ScreenTbl.findOne({
      _id: screen,
      theatre: theatreId,
    });
    if (!screenDoc) {
      return res.json({
        success: false,
        message: "Screen not found for this theatre",
      });
    }

    // Set default dates if not provided (current week)
    const currentWeek = getCurrentWeekDates();
    const showStartDate = startDate || currentWeek.start;
    const showEndDate = endDate || currentWeek.end;

    // Check if show already exists for this time slot
    const existingShow = await Show.findOne({
      movie,
      screen,
      showDateTime: new Date(`${showStartDate} ${showTime}`),
      theatre: theatreId
    });

    if (existingShow) {
      return res.json({
        success: false,
        message: "Show already exists for this time slot and date range",
      });
    }

    console.log("Creating show with data:", {
      movie,
      theatre: theatreId,
      screen,
      showTime,
      showStartDate,
      showEndDate,
      language,
      isActive
    });

    // Create the show with correct structure from ScreenTbl
    const show = await Show.create({
      movie,
      theatre: theatreId,
      screen: screen,
      showDateTime: new Date(`${showStartDate} ${showTime}`),
      showTime,
      startDate: new Date(showStartDate),
      endDate: new Date(showEndDate),
      language,
      basePrice: 150,
      seatTiers: screenDoc.seatTiers.map(tier => ({
        tierName: tier.tierName,
        price: tier.price,
        seatsPerRow: tier.seatsPerRow || screenDoc.seatLayout.seatsPerRow,
        rowCount: tier.rows.length,
        totalSeats: (tier.seatsPerRow || screenDoc.seatLayout.seatsPerRow) * tier.rows.length,
        occupiedSeats: {},
      })),
      totalCapacity: screenDoc.seatLayout.totalSeats,
      isActive,
    });

    console.log("Show created successfully:", show);

    // Populate the show with movie and screen details
    await show.populate('movie screen');

    res.json({
      success: true,
      message: "Show added successfully",
      show,
    });
  } catch (error) {
    console.error("[addShow]", error);
    res.json({ success: false, message: error.message });
  }
};

// Helper function to get current week dates
function getCurrentWeekDates() {
  const today = new Date();
  const currentDay = today.getDay();
  const diff = today.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
  const monday = new Date(today.setDate(diff));
  const sunday = new Date(today.setDate(diff + 6));
  
  return {
    start: monday.toISOString().split('T')[0],
    end: sunday.toISOString().split('T')[0]
  };
}

// Get all shows for manager's theatre
export const getTheatreShows = async (req, res) => {
  try {
    const manager = await User.findById(req.user.id);
    console.log("Manager found:", manager?._id, manager?.role);
    
    if (!manager || manager.role !== "manager") {
      return res.json({
        success: false,
        message: "Unauthorized - Manager access required",
      });
    }

    const theatreId = manager.managedTheaterId || manager.managedTheatreId;
    console.log("Theatre ID:", theatreId);
    
    const { movieId, status = "all" } = req.query;

    let query = { theatre: theatreId };
    console.log("Show query:", query);

    if (movieId) {
      query.movie = movieId;
    }

    if (status === "upcoming") {
      query.showDateTime = { $gte: new Date() };
    } else if (status === "past") {
      query.showDateTime = { $lt: new Date() };
    }

    console.log("Final query:", query);
    const shows = await Show.find(query)
      .populate("movie", "title poster_path")
      .populate("screen", "screenNumber name")
      .sort({ showDateTime: -1 });

    console.log("Found shows:", shows.length, shows);

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

    const theatreId = manager.managedTheaterId || manager.managedTheatreId;
    const { showId } = req.params;
    const updates = req.body;

    // Ensure show belongs to manager's theatre
    const show = await Show.findOne({
      _id: showId,
      theatre: theatreId,
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

    const theatreId = manager.managedTheaterId || manager.managedTheatreId;
    const { showId } = req.params;

    const show = await Show.findOne({
      _id: showId,
      theatre: theatreId,
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

    const theatreId = manager.managedTheaterId || manager.managedTheatreId;

    const activeShows = await Show.countDocuments({
      theatre: theatreId,
      showDateTime: { $gte: new Date() },
      isActive: true,
    });

    const totalShows = await Show.countDocuments({
      theatre: theatreId,
    });

    const theatre = await Theatre.findById(theatreId);

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

// Toggle Show Status (Enable/Disable)
export const toggleShowStatus = async (req, res) => {
  try {
    const manager = await User.findById(req.user.id);
    if (!manager || manager.role !== "manager") {
      return res.json({
        success: false,
        message: "Unauthorized - Manager access required",
      });
    }

    const { showId } = req.params;
    const { isActive } = req.body;

    const show = await Show.findById(showId);
    if (!show) {
      return res.json({ success: false, message: "Show not found" });
    }

    // Verify show belongs to manager's theatre
    if (show.theatre.toString() !== (manager.managedTheaterId || manager.managedTheatreId).toString()) {
      return res.json({ success: false, message: "Not authorized to manage this show" });
    }

    show.isActive = isActive;
    await show.save();

    res.json({ 
      success: true, 
      message: `Show ${isActive ? 'enabled' : 'disabled'} successfully`,
      show 
    });
  } catch (error) {
    console.error("[toggleShowStatus]", error);
    res.json({ success: false, message: error.message });
  }
};

// Repeat Shows for Next Week
export const repeatShowsForNextWeek = async (req, res) => {
  try {
    const manager = await User.findById(req.user.id);
    if (!manager || manager.role !== "manager") {
      return res.json({
        success: false,
        message: "Unauthorized - Manager access required",
      });
    }

    const { currentWeekStart, currentWeekEnd, nextWeekStart, nextWeekEnd } = req.body;

    // Get current week shows
    const currentShows = await Show.find({
      theatre: manager.managedTheaterId || manager.managedTheatreId,
      startDate: { $gte: new Date(currentWeekStart) },
      endDate: { $lte: new Date(currentWeekEnd) },
      isActive: true
    }).populate('movie screen');

    let repeatedShows = 0;

    for (const show of currentShows) {
      // Check if show already exists for next week
      const existingShow = await Show.findOne({
        theatre: manager.managedTheaterId || manager.managedTheatreId,
        movie: show.movie._id,
        screen: show.screen._id,
        showTime: show.showTime,
        language: show.language,
        startDate: { $gte: new Date(nextWeekStart) },
        endDate: { $lte: new Date(nextWeekEnd) }
      });

      if (!existingShow) {
        // Create new show for next week
        await Show.create({
          theatre: manager.managedTheaterId || manager.managedTheatreId,
          movie: show.movie._id,
          screen: show.screen._id,
          showDateTime: new Date(`${nextWeekStart} ${show.showTime}`),
          showTime: show.showTime,
          startDate: new Date(nextWeekStart),
          endDate: new Date(nextWeekEnd),
          language: show.language,
          basePrice: show.basePrice || 150,
          seatTiers: show.seatTiers || [],
          totalCapacity: show.totalCapacity || 200,
          isActive: true
        });
        repeatedShows++;
      }
    }

    res.json({ 
      success: true, 
      message: `Successfully repeated ${repeatedShows} shows for next week`,
      count: repeatedShows
    });
  } catch (error) {
    console.error("[repeatShowsForNextWeek]", error);
    res.json({ success: false, message: error.message });
  }
};
