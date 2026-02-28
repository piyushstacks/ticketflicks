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
    dashboardData: {
      totalBookings: bookings.length,
      totalRevenue,
      activeShows: activeShows.length,
      totalUsers,
      totalManagers,
      totalTheatres,
      recentBookings: bookings.slice(0, 5),
      upcomingShows: activeShows.slice(0, 5),
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
  const theatres = await Theatre.find()
    .populate("manager_id", "name email phone")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    theatres: theatres.map((t) => ({
      id: t._id.toString(),
      name: t.name,
      location: t.location,
      city: t.city,
      manager: t.manager_id ? {
        id: t.manager_id._id?.toString() || t.manager_id.toString(),
        name: t.manager_id.name || "N/A",
        email: t.manager_id.email || "N/A",
      } : null,
      approvalStatus: t.approval_status,
      disabled: t.disabled,
      createdAt: t.createdAt,
    })),
  });
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

export default {
  isAdmin,
  fetchDashboardData,
  getPendingTheatres,
  approveTheatre,
  getAllUsers,
  getAllTheatres,
  getStatistics,
};
