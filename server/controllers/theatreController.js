/**
 * Theatre Controller
 * Business logic delegated to theatreService
 */

import theatreService from "../services/theatreService.js";
import { asyncHandler } from "../middleware/errorHandler.js";

/**
 * Request OTP for theatre registration
 */
export const requestTheatreRegistrationOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const result = await theatreService.requestTheatreOtp(email);
  res.json(result);
});

/**
 * Register a new theatre
 */
export const registerTheatre = asyncHandler(async (req, res) => {
  const result = await theatreService.registerTheatre(req.body);
  res.status(201).json(result);
});

/**
 * Get theatre details
 */
export const getTheatreDetails = asyncHandler(async (req, res) => {
  const { theatreId } = req.params;
  const theatre = await theatreService.getTheatreDetails(theatreId);
  res.json({ success: true, theatre });
});

/**
 * Get all theatres
 */
export const getAllTheatres = asyncHandler(async (req, res) => {
  const { city, skip = 0, limit = 50 } = req.query;
  const filters = city ? { city } : {};
  const result = await theatreService.getAllTheatres(
    filters,
    Number(skip),
    Number(limit)
  );
  res.json({ success: true, ...result });
});

/**
 * Search theatres by location (public)
 */
export const searchTheatres = asyncHandler(async (req, res) => {
  const { location } = req.query;
  const result = await theatreService.getAllTheatres(
    location ? { city: location } : {},
    0,
    100
  );
  res.json({ success: true, ...result });
});

/**
 * Get pending theatres (admin only)
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
 * Approve or decline theatre (admin only)
 */
export const approveTheatre = asyncHandler(async (req, res) => {
  const { theatreId } = req.params;
  const { action, notes } = req.body;
  const result = await theatreService.approveTheatre(theatreId, action, notes);
  res.json(result);
});

export default {
  requestTheatreRegistrationOtp,
  registerTheatre,
  getTheatreDetails,
  getAllTheatres,
  searchTheatres,
  getPendingTheatres,
  approveTheatre,
};
