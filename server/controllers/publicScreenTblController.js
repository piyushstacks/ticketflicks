import ScreenTbl from "../models/ScreenTbl.js";
import Theatre from "../models/Theatre.js";
import Seat from "../models/Seat.js";
import SeatCategory from "../models/SeatCategory.js";
import { asyncHandler, AppError } from "../services/errorService.js";

// ─────────────────────────────────────────────
//  PUBLIC – Screen queries for booking flow
// ─────────────────────────────────────────────

export const getTheatreScreensPublic = asyncHandler(async (req, res) => {
  const { theatreId } = req.params;
  if (!theatreId) throw new AppError("Theatre ID is required", 400);

  const theatre = await Theatre.findOne({
    _id: theatreId,
    approval_status: "approved",
  });
  if (!theatre) throw new AppError("Theatre not found or not available", 404);

  const screens = await ScreenTbl.find({
    theatre: theatreId,
    isActive: true,
    status: "active",
  })
    .select("name screenNumber seatLayout seatTiers isActive status")
    .sort({ name: 1 });

  res.json({
    success: true,
    screens,
    theatre: { _id: theatre._id, name: theatre.name, location: theatre.location },
  });
});

export const getScreenDetailsPublic = asyncHandler(async (req, res) => {
  const { screenId } = req.params;
  if (!screenId) throw new AppError("Screen ID is required", 400);

  const screen = await ScreenTbl.findOne({ _id: screenId, isActive: true, status: "active" })
    .populate("theatre", "name location address city approval_status disabled")
    .populate("seatTiers.category_id", "name price description")
    .select("name screenNumber seatLayout seatTiers isActive status");

  if (!screen) throw new AppError("Screen not found or not available", 404);
  if (screen.theatre && (screen.theatre.approval_status !== "approved" || screen.theatre.disabled)) {
    throw new AppError("Theatre not available", 400);
  }

  // Attach the normalised seat rows from seats collection
  const seatDocs = await Seat.find({ screen_id: screenId, isActive: true })
    .populate("category_id", "name price description")
    .lean();

  res.json({ success: true, screen, seats: seatDocs });
});

export const getScreensByManagerPublic = asyncHandler(async (req, res) => {
  const { managerId } = req.params;
  if (!managerId) throw new AppError("Manager ID is required", 400);

  const theatre = await Theatre.findOne({
    manager_id: managerId,
    approval_status: "approved",
    disabled: false,
  });
  if (!theatre) throw new AppError("Theatre not found or not available", 404);

  const screens = await ScreenTbl.find({
    theatre: theatre._id,
    isActive: true,
    status: "active",
  })
    .select("name screenNumber seatLayout seatTiers isActive status")
    .sort({ name: 1 });

  res.json({
    success: true,
    screens,
    theatre: { _id: theatre._id, name: theatre.name, location: theatre.location },
  });
});

// ─────────────────────────────────────────────
//  SEAT CATEGORIES (admin / manager)
// ─────────────────────────────────────────────

/** POST /api/seat-categories  – create a category */
export const createSeatCategory = asyncHandler(async (req, res) => {
  const { name, price, description } = req.body;
  if (!name || price === undefined) {
    throw new AppError("name and price are required", 400);
  }

  const category = await SeatCategory.create({ name, price, description });
  res.status(201).json({ success: true, category });
});

/** GET /api/seat-categories  – list all active categories */
export const getAllSeatCategories = asyncHandler(async (req, res) => {
  const categories = await SeatCategory.find({ isActive: true }).sort({ price: 1 });
  res.json({ success: true, categories });
});

/** PUT /api/seat-categories/:categoryId  – update price / description */
export const updateSeatCategory = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;
  const { price, description, isActive } = req.body;

  const category = await SeatCategory.findByIdAndUpdate(
    categoryId,
    { ...(price !== undefined && { price }), ...(description !== undefined && { description }), ...(isActive !== undefined && { isActive }) },
    { new: true, runValidators: true }
  );
  if (!category) throw new AppError("Category not found", 404);
  res.json({ success: true, category });
});

// ─────────────────────────────────────────────
//  SEATS – normalised SEAT_TBL operations
// ─────────────────────────────────────────────

/**
 * POST /api/screens/:screenId/seats
 * Body: { category_id, seat_codes: ["A1","A2",...] }
 * Creates (or replaces) the seat-group for that screen+category.
 */
export const createSeats = asyncHandler(async (req, res) => {
  const { screenId } = req.params;
  const { category_id, seat_codes } = req.body;

  if (!category_id || !seat_codes?.length) {
    throw new AppError("category_id and seat_codes[] are required", 400);
  }

  const screen = await ScreenTbl.findById(screenId);
  if (!screen) throw new AppError("Screen not found", 404);

  const category = await SeatCategory.findById(category_id);
  if (!category) throw new AppError("Seat category not found", 404);

  // Upsert: one seat-doc per (screen, category) pair
  const seat = await Seat.findOneAndUpdate(
    { screen_id: screenId, category_id },
    { seat_codes: seat_codes.map((s) => s.trim().toUpperCase()) },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Update ScreenTbl.seatTiers denormalised entry
  const tierIdx = screen.seatTiers.findIndex(
    (t) => t.category_id?.toString() === category_id
  );
  const tierEntry = {
    category_id,
    tierName: category.name,
    price: category.price,
  };
  if (tierIdx !== -1) screen.seatTiers[tierIdx] = tierEntry;
  else screen.seatTiers.push(tierEntry);
  await screen.save();

  res.status(201).json({ success: true, seat });
});

/** GET /api/screens/:screenId/seats  – all seats for a screen, grouped by category */
export const getSeatsByScreen = asyncHandler(async (req, res) => {
  const { screenId } = req.params;

  const screen = await ScreenTbl.findById(screenId);
  if (!screen) throw new AppError("Screen not found", 404);

  const seats = await Seat.find({ screen_id: screenId, isActive: true })
    .populate("category_id", "name price description")
    .lean();

  res.json({ success: true, seats });
});

/** GET /api/seats  – all seats (admin overview) */
export const getAllSeats = asyncHandler(async (req, res) => {
  const seats = await Seat.find()
    .populate("screen_id", "name screenNumber theatre")
    .populate("category_id", "name price")
    .lean();
  res.json({ success: true, seats });
});

/** PUT /api/seats/:seatId  – update seat_codes or toggle isActive */
export const updateSeat = asyncHandler(async (req, res) => {
  const { seatId } = req.params;
  const { seat_codes, isActive } = req.body;

  const seat = await Seat.findByIdAndUpdate(
    seatId,
    {
      ...(seat_codes && { seat_codes: seat_codes.map((s) => s.trim().toUpperCase()) }),
      ...(isActive !== undefined && { isActive }),
    },
    { new: true, runValidators: true }
  ).populate("category_id", "name price");

  if (!seat) throw new AppError("Seat record not found", 404);
  res.json({ success: true, seat });
});

/** DELETE /api/seats/:seatId */
export const deleteSeat = asyncHandler(async (req, res) => {
  const { seatId } = req.params;
  const seat = await Seat.findByIdAndDelete(seatId);
  if (!seat) throw new AppError("Seat record not found", 404);
  res.json({ success: true, message: "Seat group deleted" });
});

export default {
  getTheatreScreensPublic,
  getScreenDetailsPublic,
  getScreensByManagerPublic,
  createSeatCategory,
  getAllSeatCategories,
  updateSeatCategory,
  createSeats,
  getSeatsByScreen,
  getAllSeats,
  updateSeat,
  deleteSeat,
};
