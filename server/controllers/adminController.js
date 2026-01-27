import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import User from "../models/User.js";
import Theatre from "../models/Theatre.js";
import bcryptjs from "bcryptjs";
import sendEmail from "../configs/nodeMailer.js";

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

// Get pending theatre registrations - New
export const getPendingTheatres = async (req, res) => {
  try {
    const pendingTheatres = await Theatre.find({ approval_status: "pending" })
      .populate("manager_id", "name email phone")
      .sort({ createdAt: -1 });
    
    res.json({ success: true, theatres: pendingTheatres });
  } catch (error) {
    console.error("[getPendingTheatres]", error);
    res.json({ success: false, message: error.message });
  }
};

// Approve theatre registration - New
export const approveTheatre = async (req, res) => {
  try {
    const { theatreId } = req.params;
    const { action } = req.body; // "approve" or "decline"

    if (!["approve", "decline"].includes(action)) {
      return res.json({ success: false, message: "Invalid action" });
    }

    const theatre = await Theatre.findById(theatreId).populate("manager_id");
    if (!theatre) {
      return res.json({ success: false, message: "Theatre not found" });
    }

    if (theatre.approval_status !== "pending") {
      return res.json({ success: false, message: "Theatre has already been processed" });
    }

    if (action === "approve") {
      // Update theatre status
      theatre.approval_status = "approved";
      theatre.approval_date = new Date();
      await theatre.save();

      // Update manager role from pending_manager to manager
      const manager = await User.findById(theatre.manager_id);
      if (manager && manager.role === "pending_manager") {
        manager.role = "manager";
        await manager.save();
      }

      // Generate login credentials email
      try {
        const subject = "Theatre Registration Approved - Login Credentials";
        const body = `
          <h2>Theatre Registration Approved!</h2>
          <p>Dear ${manager.name},</p>
          <p>Your theatre registration has been approved by the admin.</p>
          <p><strong>Theatre Details:</strong></p>
          <ul>
            <li><strong>Theatre Name:</strong> ${theatre.name}</li>
            <li><strong>Location:</strong> ${theatre.location}</li>
            <li><strong>Contact:</strong> ${theatre.contact_no}</li>
          </ul>
          <p><strong>Login Credentials:</strong></p>
          <ul>
            <li><strong>Email:</strong> ${manager.email}</li>
            <li><strong>Password:</strong> Use the password you set during registration</li>
          </ul>
          <p>You can now log in to your theatre management dashboard.</p>
          <p>Thank you for choosing our platform!</p>
        `;
        
        await sendEmail({
          to: manager.email,
          subject,
          body,
        });
      } catch (emailError) {
        console.error("Error sending approval email:", emailError);
      }

      res.json({ 
        success: true, 
        message: "Theatre approved successfully and login credentials sent to manager" 
      });
    } else {
      // Decline the theatre
      theatre.approval_status = "declined";
      theatre.approval_date = new Date();
      await theatre.save();

      // Send decline email
      try {
        const subject = "Theatre Registration Declined";
        const body = `
          <h2>Theatre Registration Update</h2>
          <p>Dear ${manager.name},</p>
          <p>We regret to inform you that your theatre registration has been declined by the admin.</p>
          <p><strong>Theatre Name:</strong> ${theatre.name}</p>
          <p>If you believe this was an error, please contact our support team.</p>
          <p>Thank you for your interest in our platform.</p>
        `;
        
        await sendEmail({
          to: manager.email,
          subject,
          body,
        });
      } catch (emailError) {
        console.error("Error sending decline email:", emailError);
      }

      res.json({ 
        success: true, 
        message: "Theatre declined successfully and notification sent to manager" 
      });
    }
  } catch (error) {
    console.error("[approveTheatre]", error);
    res.json({ success: false, message: error.message });
  }
};

//API to get all shows
export const fetchAllShows = async (req, res) => {
  try {
    const shows = await Show.find({ showDateTime: { $gte: new Date() } })
      .populate("movie")
      .populate("theatre")
      .populate("screen")
      .sort({ showDateTime: 1 });

    res.json({ success: true, shows });
  } catch (error) {
    console.error("[fetchAllShows]", error);
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

//API to get all screens from all theatres
export const fetchAllScreens = async (req, res) => {
  try {
    const theatres = await Theatre.find({ disabled: { $ne: true } })
      .populate("manager_id", "name email phone")
      .sort({ name: 1 });

    const screensData = [];
    
    theatres.forEach(theatre => {
      if (theatre.screens && theatre.screens.length > 0) {
        theatre.screens.forEach((screen, index) => {
          screensData.push({
            _id: `${theatre._id}-screen-${index}`,
            theatre: {
              _id: theatre._id,
              name: theatre.name,
              location: theatre.location,
              manager: theatre.manager_id
            },
            screen: {
              name: screen.name,
              layout: screen.layout,
              pricing: screen.pricing,
              totalSeats: screen.totalSeats,
              status: screen.status
            },
            screenIndex: index
          });
        });
      }
    });

    res.json({ success: true, screens: screensData });
  } catch (error) {
    console.error("[fetchAllScreens]", error);
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
    const theatres = await Theatre.find({ disabled: { $ne: true } })
      .populate("manager_id", "name email phone")
      .sort({ name: 1 });
    
    const disabledTheatres = await Theatre.find({ disabled: true })
      .populate("manager_id", "name email phone")
      .sort({ name: 1 });
    
    res.json({ success: true, theatres, disabledTheatres });
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
    const { name, location, contact_no, managerId } = req.body;

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
    const { name, location, contact_no, email, address, city, state, zipCode, managerId } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (location) updateData.location = location;
    if (contact_no) updateData.contact_no = contact_no;
    if (email !== undefined) updateData.email = email;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (zipCode !== undefined) updateData.zipCode = zipCode;
    
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

// Disable Theatre - New
export const disableTheatre = async (req, res) => {
  try {
    const { theatreId } = req.params;

    const theatre = await Theatre.findByIdAndUpdate(
      theatreId,
      { 
        disabled: true, 
        disabled_date: new Date() 
      }, 
      { new: true }
    ).populate("manager_id", "name email phone");

    if (!theatre) {
      return res.json({ success: false, message: "Theatre not found" });
    }

    res.json({ success: true, message: "Theatre disabled successfully", theatre });
  } catch (error) {
    console.error("[disableTheatre]", error);
    res.json({ success: false, message: error.message });
  }
};

// Enable Theatre - New
export const enableTheatre = async (req, res) => {
  try {
    const { theatreId } = req.params;

    const theatre = await Theatre.findByIdAndUpdate(
      theatreId,
      { 
        disabled: false, 
        disabled_date: null 
      }, 
      { new: true }
    ).populate("manager_id", "name email phone");

    if (!theatre) {
      return res.json({ success: false, message: "Theatre not found" });
    }

    res.json({ success: true, message: "Theatre enabled successfully", theatre });
  } catch (error) {
    console.error("[enableTheatre]", error);
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
