import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import User from "../models/User.js";
import Theatre from "../models/Theatre.js";

export const isAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const isAdminUser = user && user.role === "admin";
    res.json({ success: true, isAdmin: isAdminUser });
  } catch (error) {
    res.json({ success: false, message: "not authorized", isAdmin: false });
  }
};

//API to get dashboard data
export const fetchDashboardData = async (req, res) => {
  try {
    const bookings = await Booking.find({ isPaid: true });
    const activeShows = await Show.find({
      showDateTime: { $gte: new Date() },
    }).populate("movie");

    const totalUser = await User.countDocuments();

    const dashboardData = {
      totalBookings: bookings.length,
      totalRevenue: bookings.reduce((acc, booking) => acc + booking.amount, 0),
      activeShows,
      totalUser,
    };

    res.json({ success: true, dashboardData });
  } catch (error) {
    console.error("[fetchDashboardData]", error);
    res.json({ success: false, message: error.message });
  }
};

// Get pending theatres
export const getPendingTheatres = async (req, res) => {
  try {
    // For now, return empty array as we don't have a pending status field
    // This can be updated when theatre approval workflow is implemented
    res.json({ success: true, theatres: [] });
  } catch (error) {
    console.error("[getPendingTheatres]", error);
    res.json({ success: false, message: error.message });
  }
};

// Enable theatre
export const enableTheatre = async (req, res) => {
  try {
    const { theatreId } = req.params;
    
    const theatre = await Theatre.findById(theatreId);
    if (!theatre) {
      return res.json({ success: false, message: "Theatre not found" });
    }
    
    // For now, just return success as we don't have an enabled/disabled status field
    // This can be updated when theatre status management is implemented
    res.json({ success: true, message: "Theatre enabled successfully" });
  } catch (error) {
    console.error("[enableTheatre]", error);
    res.json({ success: false, message: error.message });
  }
};

// Disable theatre
export const disableTheatre = async (req, res) => {
  try {
    const { theatreId } = req.params;
    
    const theatre = await Theatre.findById(theatreId);
    if (!theatre) {
      return res.json({ success: false, message: "Theatre not found" });
    }
    
    // For now, just return success as we don't have an enabled/disabled status field
    // This can be updated when theatre status management is implemented
    res.json({ success: true, message: "Theatre disabled successfully" });
  } catch (error) {
    console.error("[disableTheatre]", error);
    res.json({ success: false, message: error.message });
  }
};

//API to get all shows
export const fetchAllShows = async (req, res) => {
  try {
    const shows = await Show.find({ showDateTime: { $gte: new Date() } })
      .populate("movie")
      .sort({ showDateTime: 1 });

    res.json({ success: true, shows });
  } catch (error) {
    console.error("[fetchAllShows]", error);
    res.json({ success: false, message: error.message });
  }
};

//API to get all screens
export const fetchAllScreens = async (req, res) => {
  try {
    const theatres = await Theatre.find({})
      .select('name screens')
      .sort({ name: 1 });
    
    const allScreens = [];
    theatres.forEach(theatre => {
      theatre.screens.forEach(screen => {
        allScreens.push({
          theatreId: theatre._id,
          theatreName: theatre.name,
          screenId: screen._id,
          screenName: screen.name,
          totalSeats: screen.totalSeats,
          status: screen.status || 'active'
        });
      });
    });

    res.json({ success: true, screens: allScreens });
  } catch (error) {
    console.error("[fetchAllScreens]", error);
    res.json({ success: false, message: error.message });
  }
};

//API to get all bookings
export const fetchAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({})
      .populate("user")
      .populate({ path: "show", populate: { path: "movie" } })
      .sort({ createdAt: -1 });

    res.json({ success: true, bookings });
  } catch (error) {
    console.error("[fetchAllBookings]", error);
    res.json({ success: false, message: error.message });
  }
};

// Admin Dashboard Data - New
export const dashboardAdminData = async (req, res) => {
  try {
    const totalTheatres = await Theatre.countDocuments();
    const activeUsers = await User.countDocuments({ role: "customer" });
    const paidBookings = await Booking.find({ isPaid: true });
    const totalRevenue = paidBookings.reduce((sum, b) => sum + (b.amount || 0), 0);

    res.json({
      success: true,
      data: {
        totalTheatres,
        activeUsers,
        totalRevenue,
        totalBookings: paidBookings.length,
      },
    });
  } catch (error) {
    console.error("[dashboardAdminData]", error);
    res.json({ success: false, message: error.message });
  }
};

// Get All Theatres - New
export const getAllTheatres = async (req, res) => {
  try {
    const theatres = await Theatre.find()
      .populate("manager_id", "name email phone")
      .sort({ name: 1 });
    
    res.json({ success: true, theatres });
  } catch (error) {
    console.error("[getAllTheatres]", error);
    res.json({ success: false, message: error.message });
  }
};

// Get Theatre Details - New
export const getTheatreDetails = async (req, res) => {
  try {
    const { theatreId } = req.params;
    
    const theatre = await Theatre.findById(theatreId)
      .populate("manager_id", "name email phone");
    
    if (!theatre) {
      return res.json({ success: false, message: "Theatre not found" });
    }

    res.json({ success: true, theatre });
  } catch (error) {
    console.error("[getTheatreDetails]", error);
    res.json({ success: false, message: error.message });
  }
};

// Create Theatre - New
export const createTheatre = async (req, res) => {
  try {
    const { name, location, contact_no, managerId, address, city, state, zipCode, email } = req.body;

    if (!name || !location || !contact_no) {
      return res.json({ success: false, message: "Missing required fields" });
    }

    // Check if manager exists and has manager role
    if (!managerId) {
      return res.json({ success: false, message: "Manager is required" });
    }

    const manager = await User.findById(managerId);
    if (!manager || manager.role !== "manager") {
      return res.json({ success: false, message: "Invalid manager" });
    }

    const theatre = await Theatre.create({
      name,
      location,
      contact_no,
      manager_id: managerId,
      address: address || "",
      city: city || "",
      state: state || "",
      zipCode: zipCode || "",
      email: email || "",
      screens: [],
    });

    const populatedTheatre = await theatre.populate("manager_id", "name email phone");

    res.json({ success: true, message: "Theatre created successfully", theatre: populatedTheatre });
  } catch (error) {
    console.error("[createTheatre]", error);
    res.json({ success: false, message: error.message });
  }
};

// Update Theatre - New
export const updateTheatre = async (req, res) => {
  try {
    const { theatreId } = req.params;
    const { name, location, contact_no, managerId, address, city, state, zipCode, email } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (location) updateData.location = location;
    if (contact_no) updateData.contact_no = contact_no;
    if (address) updateData.address = address;
    if (city) updateData.city = city;
    if (state) updateData.state = state;
    if (zipCode) updateData.zipCode = zipCode;
    if (email) updateData.email = email;
    
    if (managerId) {
      const manager = await User.findById(managerId);
      if (!manager || manager.role !== "manager") {
        return res.json({ success: false, message: "Invalid manager" });
      }
      updateData.manager_id = managerId;
    }

    const theatre = await Theatre.findByIdAndUpdate(theatreId, updateData, { new: true })
      .populate("manager_id", "name email phone");

    if (!theatre) {
      return res.json({ success: false, message: "Theatre not found" });
    }

    res.json({ success: true, message: "Theatre updated successfully", theatre });
  } catch (error) {
    console.error("[updateTheatre]", error);
    res.json({ success: false, message: error.message });
  }
};

// Delete Theatre - New
export const deleteTheatre = async (req, res) => {
  try {
    const { theatreId } = req.params;

    const theatre = await Theatre.findByIdAndDelete(theatreId);

    if (!theatre) {
      return res.json({ success: false, message: "Theatre not found" });
    }

    res.json({ success: true, message: "Theatre deleted successfully" });
  } catch (error) {
    console.error("[deleteTheatre]", error);
    res.json({ success: false, message: error.message });
  }
};

// Get Theatre Payments/Bookings - New
export const getTheatrePayments = async (req, res) => {
  try {
    const { theatreId } = req.params;

    const bookings = await Booking.find({
      theater: theatreId,
      isPaid: true,
    })
      .populate("user", "name email")
      .populate({
        path: "show",
        populate: { path: "movie" },
      })
      .sort({ createdAt: -1 });

    const totalRevenue = bookings.reduce((sum, b) => sum + (b.amount || 0), 0);

    res.json({
      success: true,
      bookings,
      totalRevenue,
      count: bookings.length,
    });
  } catch (error) {
    console.error("[getTheatrePayments]", error);
    res.json({ success: false, message: error.message });
  }
};
