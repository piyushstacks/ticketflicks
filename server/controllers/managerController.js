import Show from "../models/show_tbls.js";
import Screen from "../models/Screen.js";
import Movie from "../models/Movie.js";
import Theatre from "../models/Theatre.js";
import Booking from "../models/Booking.js";
import User from "../models/User.js";

// Dashboard Data for Manager
export const dashboardManagerData = async (req, res) => {
  try {
    const manager = await User.findById(req.user.id);
    console.log("[DEBUG] dashboardManagerData - manager:", manager?._id, manager?.email);
    if (!manager || manager.role !== "manager") {
      return res.json({ success: false, message: "Not authorized" });
    }

    // Find theatre by manager_id (manager's user ID)
    console.log("[DEBUG] Looking for theatre with manager_id:", manager._id, "Type:", typeof manager._id);
    const theatre = await Theatre.findOne({ 
      manager_id: manager._id, 
      disabled: { $ne: true },
      approval_status: 'approved' 
    });
    console.log("[DEBUG] Theatre query result:", theatre);
    
    if (!theatre) {
      // Check all theatres for this manager without approval filter
      const allTheatres = await Theatre.find({ manager_id: manager._id });
      console.log("[DEBUG] All theatres for this manager (any status):", allTheatres.map(t => ({id: t._id, status: t.approval_status, disabled: t.disabled})));
      return res.json({ success: false, message: "Manager has no theatre assigned" });
    }
    
    const theatreId = theatre._id;

    const activeShows = await Show.countDocuments({
      theater_id: theatreId,
      show_date: { $gte: new Date() },
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayBookings = await Booking.countDocuments({
      theater_id: theatreId,
      createdAt: { $gte: todayStart, $lte: todayEnd },
    });

    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const monthBookings = await Booking.find({
      theater_id: theatreId,
      isPaid: true,
      createdAt: { $gte: monthStart },
    });

    const monthRevenue = monthBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);

    const screens = await Screen.countDocuments({ Tid: theatreId });

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

    let theatreId = manager.managedTheatreId;
    if (!theatreId) {
      // Fallback: Look for theatre by manager_id
      const theatreDoc = await Theatre.findOne({ 
        manager_id: manager._id, 
        disabled: { $ne: true },
        approval_status: 'approved' 
      });
      if (!theatreDoc) {
        return res.json({ success: false, message: "Manager has no theatre assigned" });
      }
      theatreId = theatreDoc._id;
      // Update manager with the found theatre ID
      await User.findByIdAndUpdate(manager._id, { managedTheatreId: theatreId });
    }
    const { movieId, screenId, showDateTime, seatTiers } = req.body;

    if (!movieId || !screenId || !showDateTime || !seatTiers) {
      return res.json({ success: false, message: "Missing required fields" });
    }

    // Verify screen belongs to manager's theatre
    const screen = await Screen.findById(screenId);
    if (!screen || screen.Tid.toString() !== theatreId.toString()) {
      return res.json({ success: false, message: "Invalid screen" });
    }

    // Calculate basePrice from seatTiers or use default
    let basePrice = 150;
    if (seatTiers && Array.isArray(seatTiers) && seatTiers.length > 0) {
      // Use the lowest tier price as basePrice
      basePrice = Math.min(...seatTiers.map(t => t.price));
    }

    const show = await Show.create({
      movie_id: movieId,
      theater_id: theatreId,
      screen_id: screenId,
      show_date: showDateTime,
      seatTiers: seatTiers,
      available_seats: [],
      isActive: true,
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
    const manager = await UserNew.findById(req.user.id);
    if (!manager || manager.role !== "manager") {
      return res.json({ success: false, message: "Not authorized" });
    }

    const theatreId = manager.managedTheatreId;
    const { showId } = req.params;
    const { movieId, screenId, showDateTime, seatTiers, basePrice: providedBasePrice } = req.body;

    const show = await ShowNew.findById(showId);
    if (!show || show.theatre.toString() !== theatreId.toString()) {
      return res.json({ success: false, message: "Invalid show or not authorized" });
    }

    const updateData = {};
    if (movieId) updateData.movie = movieId;
    if (screenId) updateData.screen = screenId;
    if (showDateTime) updateData.showDateTime = showDateTime;
    if (seatTiers) {
      updateData.seatTiers = seatTiers;
      // If seatTiers are updated, update basePrice too if not explicitly provided
      if (!providedBasePrice && Array.isArray(seatTiers) && seatTiers.length > 0) {
        updateData.basePrice = Math.min(...seatTiers.map(t => t.price));
      }
    }
    if (providedBasePrice) updateData.basePrice = providedBasePrice;

    const updatedShow = await ShowNew.findByIdAndUpdate(showId, updateData, { new: true })
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
    const manager = await UserNew.findById(req.user.id);
    if (!manager || manager.role !== "manager") {
      return res.json({ success: false, message: "Not authorized" });
    }

    const theatreId = manager.managedTheatreId;
    const { showId } = req.params;

    const show = await ShowNew.findById(showId);
    if (!show || show.theatre.toString() !== theatreId.toString()) {
      return res.json({ success: false, message: "Invalid show or not authorized" });
    }

    await ShowNew.findByIdAndDelete(showId);

    res.json({ success: true, message: "Show deleted successfully" });
  } catch (error) {
    console.error("[deleteShow]", error);
    res.json({ success: false, message: error.message });
  }
};

// Add Screen
export const addScreen = async (req, res) => {
  try {
    const manager = await UserNew.findById(req.user.id);
    if (!manager || manager.role !== "manager") {
      return res.json({ success: false, message: "Not authorized" });
    }

    let theatreId = manager.managedTheatreId;
    if (!theatreId) {
      const theatreDoc = await TheaterNew.findOne({ 
        manager_id: manager._id, 
        disabled: { $ne: true },
        approval_status: 'approved' 
      });
      if (!theatreDoc) {
        return res.json({ success: false, message: "Manager has no theatre assigned" });
      }
      theatreId = theatreDoc._id;
      await UserNew.findByIdAndUpdate(manager._id, { managedTheatreId: theatreId });
    }
    const { screenNumber, seatLayout, pricing } = req.body; // Expecting pricing from frontend

    if (!screenNumber || !seatLayout) {
      return res.json({ success: false, message: "Missing required fields" });
    }

    // Convert pricing to seatTiers if provided
    let seatTiers = [];
    if (pricing) {
      // Map for seat codes to row labels
      const tierRows = {};
      const seatCodes = {
        'S': 'Standard',
        'D': 'Deluxe',
        'P': 'Premium',
        'R': 'Recliner',
        'C': 'Couple'
      };

      // Helper to get row label (A, B, C...)
      const getRowLabel = (index) => String.fromCharCode(65 + index);

      // Iterate layout to find which rows belong to which tier
      if (seatLayout.layout && Array.isArray(seatLayout.layout)) {
        seatLayout.layout.forEach((row, rowIndex) => {
          // Find distinct seat types in this row (ignoring empty '')
          const uniqueSeats = [...new Set(row.filter(s => s !== ''))];
          uniqueSeats.forEach(code => {
            if (!tierRows[code]) tierRows[code] = [];
            tierRows[code].push(getRowLabel(rowIndex));
          });
        });
      }

      // Construct seatTiers array
      // Handle unified pricing
      if (pricing.unified) {
         // If unified, we might not have tier codes or just one. 
         // But usually layout still has 'S' or something.
         // If layout has multiple codes but unified pricing, we should probably just use "Standard" for all?
         // Or apply unified price to all tiers found.
         Object.keys(tierRows).forEach(code => {
           seatTiers.push({
             tierName: seatCodes[code] || 'Standard',
             price: Number(pricing.unified),
             rows: tierRows[code]
           });
         });
         
         // If no tiers found (empty layout?), default to one tier
         if (seatTiers.length === 0) {
            seatTiers.push({
              tierName: 'Standard',
              price: Number(pricing.unified),
              rows: seatLayout.layout.map((_, i) => getRowLabel(i))
            });
         }
      } else {
        // Tier based pricing
        Object.keys(pricing).forEach(code => {
          if (pricing[code] && pricing[code].price) {
            seatTiers.push({
              tierName: seatCodes[code] || code,
              price: Number(pricing[code].price),
              rows: tierRows[code] || []
            });
          }
        });
      }
    }

    const screen = await ScreenNew.create({
      theatre: theatreId,
      name: `Screen ${screenNumber}`,
      screenNumber,
      seatLayout,
      seatTiers
    });

    // We no longer push to TheaterNew.screens as we use ScreenNew exclusively now.
    // This maintains backward compatibility for any code that might still check TheaterNew.screens
    // although we should migrate those too.
    try {
      await TheaterNew.findByIdAndUpdate(theatreId, {
        $push: { 
          screens: {
            _id: screen._id,
            name: `Screen ${screenNumber}`,
            layout: seatLayout,
            pricing: pricing || { unified: 150 },
            totalSeats: seatLayout.totalSeats,
            status: 'active'
          } 
        }
      });
    } catch (err) {
      console.warn("Failed to update TheaterNew embedded screens:", err.message);
    }

    res.json({ success: true, message: "Screen added successfully", screen });
  } catch (error) {
    console.error("[addScreen]", error);
    res.json({ success: false, message: error.message });
  }
};

// Edit Screen
export const editScreen = async (req, res) => {
  try {
    const manager = await UserNew.findById(req.user.id);
    if (!manager || manager.role !== "manager") {
      return res.json({ success: false, message: "Not authorized" });
    }

    const theatreId = manager.managedTheatreId;
    const { screenId } = req.params;
    const { screenNumber, seatLayout, pricing } = req.body;

    const screen = await ScreenNew.findById(screenId);
    if (!screen || screen.theatre.toString() !== theatreId.toString()) {
      return res.json({ success: false, message: "Invalid screen or not authorized" });
    }

    const updateData = {};
    if (screenNumber) {
      updateData.screenNumber = screenNumber;
      updateData.name = `Screen ${screenNumber}`;
    }
    if (seatLayout) updateData.seatLayout = seatLayout;
    
    if (pricing) {
       // Re-calculate seatTiers (same logic as addScreen)
       let seatTiers = [];
       const tierRows = {};
       const seatCodes = {
         'S': 'Standard', 'D': 'Deluxe', 'P': 'Premium', 'R': 'Recliner', 'C': 'Couple'
       };
       const getRowLabel = (index) => String.fromCharCode(65 + index);
       
       const layoutToUse = seatLayout || screen.seatLayout;
       
       if (layoutToUse.layout && Array.isArray(layoutToUse.layout)) {
         layoutToUse.layout.forEach((row, rowIndex) => {
           const uniqueSeats = [...new Set(row.filter(s => s !== ''))];
           uniqueSeats.forEach(code => {
             if (!tierRows[code]) tierRows[code] = [];
             tierRows[code].push(getRowLabel(rowIndex));
           });
         });
       }

       if (pricing.unified) {
          Object.keys(tierRows).forEach(code => {
            seatTiers.push({
              tierName: seatCodes[code] || 'Standard',
              price: Number(pricing.unified),
              rows: tierRows[code]
            });
          });
           if (seatTiers.length === 0 && layoutToUse.layout) {
            seatTiers.push({
              tierName: 'Standard',
              price: Number(pricing.unified),
              rows: layoutToUse.layout.map((_, i) => getRowLabel(i))
            });
         }
       } else {
         Object.keys(pricing).forEach(code => {
           if (pricing[code] && pricing[code].price) {
             seatTiers.push({
               tierName: seatCodes[code] || code,
               price: Number(pricing[code].price),
               rows: tierRows[code] || []
             });
           }
         });
       }
       updateData.seatTiers = seatTiers;
    }

    const updatedScreen = await ScreenNew.findByIdAndUpdate(screenId, updateData, { new: true });

    // Update embedded screen in TheaterNew if needed
    try {
      await TheaterNew.updateOne(
        { _id: theatreId, "screens._id": screenId },
        { 
          $set: { 
            "screens.$.name": updateData.name || screen.name,
            "screens.$.layout": seatLayout || screen.seatLayout,
            "screens.$.totalSeats": (seatLayout || screen.seatLayout).totalSeats,
            "screens.$.pricing": pricing || screen.pricing
          } 
        }
      );
    } catch (err) {
      console.warn("Failed to update embedded screen:", err.message);
    }

    res.json({ success: true, message: "Screen updated successfully", screen: updatedScreen });
  } catch (error) {
    console.error("[editScreen]", error);
    res.json({ success: false, message: error.message });
  }
};

// Delete Screen
export const deleteScreen = async (req, res) => {
  try {
    const manager = await UserNew.findById(req.user.id);
    if (!manager || manager.role !== "manager") {
      return res.json({ success: false, message: "Not authorized" });
    }

    const theatreId = manager.managedTheatreId;
    const { screenId } = req.params;

    const screen = await ScreenNew.findById(screenId);
    if (!screen || screen.theatre.toString() !== theatreId.toString()) {
      return res.json({ success: false, message: "Invalid screen or not authorized" });
    }

    await ScreenNew.findByIdAndDelete(screenId);

    // Remove screen from theatre
    await TheaterNew.findByIdAndUpdate(theatreId, {
      $pull: { screens: { _id: screenId } },
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
    const manager = await UserNew.findById(req.user.id);
    if (!manager || manager.role !== "manager") {
      return res.json({ success: false, message: "Not authorized" });
    }

    let theatreId = manager.managedTheatreId;
    if (!theatreId) {
      // Fallback: Look for theatre by manager_id
      const theatreDoc = await TheaterNew.findOne({ 
        manager_id: manager._id, 
        disabled: { $ne: true },
        approval_status: 'approved' 
      });
      if (!theatreDoc) {
        return res.json({ success: false, message: "Manager has no theatre assigned" });
      }
      theatreId = theatreDoc._id;
      // Update manager with the found theatre ID
      await UserNew.findByIdAndUpdate(manager._id, { managedTheatreId: theatreId });
    }

    const bookings = await BookingNew.find({ theatre: theatreId })
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
    const manager = await UserNew.findById(req.user.id);
    if (!manager || manager.role !== "manager") {
      return res.json({ success: false, message: "Not authorized" });
    }

    // Get movies that are available for this manager's theatre
    // This would typically be a junction table or reference in the theatre model
    // For now, we'll return all active movies as available
    const movies = await MovieNew.find({ isActive: true })
      .sort({ createdAt: -1 });

    res.json({ success: true, movies });
  } catch (error) {
    console.error("[getManagerMovies]", error);
    res.json({ success: false, message: error.message });
  }
};

// Add Movie to Manager's TheaterNew (from available list)
export const addMovie = async (req, res) => {
  try {
    const manager = await UserNew.findById(req.user.id);
    if (!manager || manager.role !== "manager") {
      return res.json({ success: false, message: "Not authorized" });
    }

    const { movieId, isActive } = req.body;

    if (!movieId) {
      return res.json({ success: false, message: "Movie ID is required" });
    }

    // Check if movie exists and is active
    const movie = await MovieNew.findById(movieId);
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
    const manager = await UserNew.findById(req.user.id);
    if (!manager || manager.role !== "manager") {
      return res.json({ success: false, message: "Not authorized" });
    }

    const { movieId } = req.params;
    const { isActive } = req.body;
    const theatreId = manager.managedTheatreId;

    if (!theatreId) {
      return res.json({ success: false, message: "Manager has no theatre assigned" });
    }

    // Find the movie
    const movie = await MovieNew.findById(movieId);
    if (!movie) {
      return res.json({ success: false, message: "Movie not found" });
    }

    if (isActive) {
      // Enable movie for this theatre - remove from excludedTheaterNews if present
      await MovieNew.findByIdAndUpdate(movieId, {
        $pull: { excludedTheaterNews: theatreId },
        $addToSet: { theatres: theatreId }
      });
    } else {
      // Disable movie for this theatre - add to excludedTheaterNews
      await MovieNew.findByIdAndUpdate(movieId, {
        $pull: { theatres: theatreId },
        $addToSet: { excludedTheaterNews: theatreId }
      });

      // Also disable all future shows for this movie at this theatre
      await ShowNew.updateMany(
        {
          movie: movieId,
          theatre: theatreId,
          showDateTime: { $gte: new Date() }
        },
        { isActive: false }
      );
    }

    res.json({ 
      success: true, 
      message: `Movie ${isActive ? 'enabled' : 'disabled'} successfully for your theatre`
    });
  } catch (error) {
    console.error("[toggleMovieStatus]", error);
    res.json({ success: false, message: error.message });
  }
};

// Remove Movie from Manager's TheaterNew
export const removeMovie = async (req, res) => {
  try {
    const manager = await UserNew.findById(req.user.id);
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
    const manager = await UserNew.findById(req.user.id);
    if (!manager || manager.role !== "manager") {
      return res.json({ success: false, message: "Not authorized" });
    }

    const { screenId } = req.params;
    const { status } = req.body;

    const screen = await ScreenNew.findById(screenId);
    if (!screen) {
      return res.json({ success: false, message: "Screen not found" });
    }

    // Verify screen belongs to manager's theatre
    const theatreId = manager.managedTheatreId;
    if (screen.theatre.toString() !== theatreId.toString()) {
      return res.json({ success: false, message: "Not authorized to manage this screen" });
    }

    screen.isActive = (status === 'active');
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
