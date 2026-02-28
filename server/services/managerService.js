/**
 * Manager Service
 * Handles manager-specific operations for their theatre
 */

import User from "../models/User.js";
import Theatre from "../models/Theatre.js";
import Show from "../models/show_tbls.js";
import Booking from "../models/Booking.js";
import { NotFoundError, UnauthorizedError } from "./errorService.js";

/**
 * Get manager's theatre
 */
export const getManagerTheatre = async (managerId) => {
  const manager = await User.findById(managerId);
  if (!manager || manager.role !== "manager") {
    throw new UnauthorizedError("Manager access required");
  }

  const theatre = await Theatre.findOne({
    manager_id: managerId,
    approval_status: "approved",
    disabled: false,
  });

  if (!theatre) {
    throw new NotFoundError("Theatre assigned to manager");
  }

  return theatre;
};

/**
 * Get manager dashboard data
 */
export const getDashboardData = async (managerId) => {
  const theatre = await getManagerTheatre(managerId);
  const theatreId = theatre._id;

  // Active shows
  const activeShows = await Show.countDocuments({
    theatre: theatreId,
    showDateTime: { $gte: new Date() },
    isActive: true,
  });

  // Today's bookings
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const todayBookings = await Booking.countDocuments({
    show_id: {
      $in: await Show.find({ theatre: theatreId }).select("_id"),
    },
    createdAt: { $gte: todayStart, $lte: todayEnd },
    status: "confirmed",
  });

  // Monthly revenue
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const monthBookings = await Booking.find({
    show_id: {
      $in: await Show.find({ theatre: theatreId }).select("_id"),
    },
    createdAt: { $gte: monthStart },
    payment_status: "completed",
  });

  const monthRevenue = monthBookings.reduce(
    (acc, booking) => acc + booking.total_amount,
    0
  );

  return {
    theatre: {
      id: theatre._id.toString(),
      name: theatre.name,
      location: theatre.location,
      city: theatre.city,
    },
    stats: {
      activeShows,
      todayBookings,
      monthRevenue,
      totalBookings: monthBookings.length,
    },
  };
};

/**
 * Get all shows for manager's theatre
 */
export const getTheatreShows = async (managerId, skip = 0, limit = 50) => {
  const theatre = await getManagerTheatre(managerId);

  const shows = await Show.find({ theatre: theatre._id })
    .populate("movie", "title poster_path duration_min")
    .populate("screen", "name")
    .skip(skip)
    .limit(limit)
    .sort({ showDateTime: -1 });

  const total = await Show.countDocuments({ theatre: theatre._id });

  return {
    shows: shows.map((s) => ({
      id: s._id.toString(),
      movie: s.movie,
      screen: s.screen,
      dateTime: s.showDateTime,
      language: s.language,
      basePrice: s.basePrice,
      status: s.status,
    })),
    pagination: {
      total,
      skip,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get bookings for manager's theatre
 */
export const getTheatreBookings = async (
  managerId,
  filters = {},
  skip = 0,
  limit = 50
) => {
  const theatre = await getManagerTheatre(managerId);

  const theatreShows = await Show.find({ theatre: theatre._id }).select("_id");
  const showIds = theatreShows.map((s) => s._id);

  const query = { show_id: { $in: showIds } };

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.paymentStatus) {
    query.payment_status = filters.paymentStatus;
  }

  const bookings = await Booking.find(query)
    .populate("user_id", "name email phone")
    .populate({
      path: "show_id",
      populate: [
        { path: "movie", select: "title" },
        { path: "screen", select: "name" },
      ],
    })
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await Booking.countDocuments(query);

  return {
    bookings: bookings.map((b) => ({
      id: b._id.toString(),
      user: {
        id: b.user_id._id.toString(),
        name: b.user_id.name,
        email: b.user_id.email,
      },
      show: {
        id: b.show_id._id.toString(),
        movie: b.show_id.movie?.title,
        screen: b.show_id.screen?.name,
        dateTime: b.show_id.showDateTime,
      },
      seats: b.seats_booked,
      totalAmount: b.total_amount,
      status: b.status,
      paymentStatus: b.payment_status,
      createdAt: b.createdAt,
    })),
    pagination: {
      total,
      skip,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
};

export default {
  getManagerTheatre,
  getDashboardData,
  getTheatreShows,
  getTheatreBookings,
};
