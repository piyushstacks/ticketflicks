/**
 * Admin Controller
 * Handles dashboard, theatre approvals, and admin operations
 */

import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Show from "../models/show_tbls.js";
import Theatre from "../models/Theatre.js";
import theatreService from "../services/theatreService.js";
import userService from "../services/userService.js";
import { asyncHandler } from "../middleware/errorHandler.js";

/**
 * Check if user is admin
 */
export const isAdmin = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  const isAdminUser = user && user.role === "admin";
  res.json({ success: true, isAdmin: isAdminUser });
});

/**
 * Get dashboard data
 */
export const fetchDashboardData = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({
    payment_status: "completed",
    status: "confirmed",
  });

  const activeShows = await Show.find({
    showDateTime: { $gte: new Date() },
    isActive: true,
  })
    .populate("movie", "title poster_path")
    .populate("theatre", "name city");

  const totalUsers = await User.countDocuments({ role: "customer" });
  const totalManagers = await User.countDocuments({ role: "manager" });
  const totalTheatres = await Theatre.countDocuments({
    approval_status: "approved",
  });

  const totalRevenue = bookings.reduce(
    (acc, booking) => acc + booking.total_amount,
    0
  );

  res.json({
    success: true,
    // Support both data.data (new AdminDashboard) and data.dashboardData (old)
    data: {
      totalBookings: bookings.length,
      totalRevenue,
      activeShows: activeShows.length,
      totalUsers,
      totalManagers,
      totalTheatres,
      activeUsers: totalUsers + totalManagers,
      recentBookings: bookings.slice(0, 5),
      upcomingShows: activeShows.slice(0, 5),
    },
    dashboardData: {
      totalBookings: bookings.length,
      totalRevenue,
      activeShows: activeShows.length,
      totalUsers,
      totalManagers,
      totalTheatres,
      activeUsers: totalUsers + totalManagers,
    },
  });
});

/**
 * Get pending theatres
 */
export const getPendingTheatres = asyncHandler(async (req, res) => {
  const { skip = 0, limit = 50 } = req.query;
  const result = await theatreService.getPendingTheatres(
    Number(skip),
    Number(limit)
  );
  res.json({ success: true, ...result });
});

/**
 * Approve or decline theatre
 */
export const approveTheatre = asyncHandler(async (req, res) => {
  const { theatreId } = req.params;
  const { action, notes } = req.body;
  const result = await theatreService.approveTheatre(theatreId, action, notes);
  res.json(result);
});

/**
 * Get all users
 */
export const getAllUsers = asyncHandler(async (req, res) => {
  const { skip = 0, limit = 50 } = req.query;
  const result = await userService.getAllUsers(Number(skip), Number(limit));
  res.json({ success: true, ...result });
});

/**
 * Get all theatres
 */
export const getAllTheatres = asyncHandler(async (req, res) => {
  const allTheatres = await Theatre.find()
    .populate("manager_id", "name email phone")
    .sort({ createdAt: -1 });

  const mapTheatre = (t) => ({
    _id: t._id,
    id: t._id.toString(),
    name: t.name,
    location: t.location,
    address: t.address,
    city: t.city,
    state: t.state,
    zipCode: t.zipCode,
    contact_no: t.contact_no,
    email: t.email,
    // Keep BOTH naming conventions so frontend filter() works
    approval_status: t.approval_status,
    approvalStatus: t.approval_status,
    disabled: t.disabled ?? false,
    manager_id: t.manager_id
      ? {
        _id: t.manager_id._id,
        name: t.manager_id.name || "N/A",
        email: t.manager_id.email || "N/A",
        phone: t.manager_id.phone,
      }
      : null,
    manager: t.manager_id
      ? {
        id: t.manager_id._id?.toString() || "",
        name: t.manager_id.name || "N/A",
        email: t.manager_id.email || "N/A",
      }
      : null,
    createdAt: t.createdAt,
  });

  const theatres = allTheatres
    .filter((t) => t.approval_status === "approved" && !t.disabled)
    .map(mapTheatre);

  const disabledTheatres = allTheatres
    .filter((t) => t.disabled === true)
    .map(mapTheatre);

  res.json({
    success: true,
    theatres,          // active approved theatres
    disabledTheatres,  // disabled theatres
    all: allTheatres.map(mapTheatre), // all theatres flat list
  });
});

/**
 * Get screens for a theatre (admin view)
 */
export const getTheatreScreens = asyncHandler(async (req, res) => {
  const { theatreId } = req.params;
  const ScreenTbl = (await import("../models/ScreenTbl.js")).default;
  const screens = await ScreenTbl.find({ theatre: theatreId }).sort({ screenNumber: 1 });
  res.json({ success: true, screens });
});

/**
 * Get statistics
 */
export const getStatistics = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments({ role: "customer" });
  const totalManagers = await User.countDocuments({ role: "manager" });
  const totalTheatres = await Theatre.countDocuments();
  const approvedTheatres = await Theatre.countDocuments({
    approval_status: "approved",
  });
  const pendingTheatres = await Theatre.countDocuments({
    approval_status: "pending",
  });

  const totalShows = await Show.countDocuments({ isActive: true });
  const bookings = await Booking.countDocuments({ status: "confirmed" });

  res.json({
    success: true,
    statistics: {
      users: {
        total: totalUsers,
        managers: totalManagers,
        customers: totalUsers,
      },
      theatres: {
        total: totalTheatres,
        approved: approvedTheatres,
        pending: pendingTheatres,
      },
      shows: totalShows,
      bookings,
    },
  });
});

/**
 * Get all bookings (admin view)
 */
export const getAllBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find()
    .populate("user_id", "name email")
    .populate({
      path: "show_id",
      populate: { path: "movie", select: "title poster_path" },
    })
    .sort({ createdAt: -1 })
    .limit(200);

  const formatted = bookings.map((b) => ({
    _id: b._id,
    user: b.user_id || { name: "Unknown", email: "" },
    show: b.show_id || { movie: { title: "Unknown" }, showDateTime: null },
    bookedSeats: b.booked_seats || b.selectedSeats || [],
    amount: b.total_amount || b.amount || 0,
    isPaid: b.payment_status === "completed" || b.isPaid || false,
    status: b.status,
    createdAt: b.createdAt,
  }));

  res.json({ success: true, bookings: formatted });
});

/**
 * Get all shows (admin view)
 */
export const getAllShows = asyncHandler(async (req, res) => {
  const shows = await Show.find()
    .populate("movie", "title poster_path overview genres")
    .populate("theatre")  // populate all theatre fields
    .populate("screen", "name screenNumber seatLayout seatTiers")
    .sort({ showDateTime: -1 })
    .limit(500);

  res.json({ success: true, shows });
});

/**
 * Get all feedbacks (admin view)
 */
export const getAllFeedbacks = asyncHandler(async (req, res) => {
  try {
    const Feedback = (await import("../models/Feedback.js")).default;
    const feedbacks = await Feedback.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(200);
    res.json({ success: true, feedbacks });
  } catch (e) {
    // Feedback model may not exist
    res.json({ success: true, feedbacks: [] });
  }
});

export default {
  isAdmin,
  fetchDashboardData,
  getPendingTheatres,
  approveTheatre,
  getAllUsers,
  getAllTheatres,
  getStatistics,
};
