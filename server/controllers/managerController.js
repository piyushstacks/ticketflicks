/**
 * Manager Controller
 * Handles manager-specific operations
 */

import managerService from "../services/managerService.js";
import { asyncHandler } from "../middleware/errorHandler.js";

/**
 * Get manager dashboard data
 */
export const dashboardManagerData = asyncHandler(async (req, res) => {
  const data = await managerService.getDashboardData(req.user.id);
  res.json({ success: true, dashboardData: data });
});

/**
 * Get theatre shows
 */
export const getTheatreShows = asyncHandler(async (req, res) => {
  const { skip = 0, limit = 50 } = req.query;
  const result = await managerService.getTheatreShows(
    req.user.id,
    Number(skip),
    Number(limit)
  );
  res.json({ success: true, ...result });
});

/**
 * Get theatre bookings
 */
export const getBookings = asyncHandler(async (req, res) => {
  const { status, paymentStatus, skip = 0, limit = 50 } = req.query;
  const filters = {};
  if (status) filters.status = status;
  if (paymentStatus) filters.paymentStatus = paymentStatus;

  const result = await managerService.getTheatreBookings(
    req.user.id,
    filters,
    Number(skip),
    Number(limit)
  );
  res.json({ success: true, ...result });
});

/**
 * Get manager's theatre details
 */
export const getTheatreDetails = asyncHandler(async (req, res) => {
  const theatre = await managerService.getManagerTheatre(req.user.id);
  res.json({
    success: true,
    theatre: {
      id: theatre._id.toString(),
      name: theatre.name,
      location: theatre.location,
      city: theatre.city,
      state: theatre.state,
      email: theatre.email,
      contact: theatre.contact_no,
      address: theatre.address,
    },
  });
});

export default {
  dashboardManagerData,
  getTheatreShows,
  getBookings,
  getTheatreDetails,
};
