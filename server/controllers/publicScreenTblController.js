import ScreenTbl from "../models/ScreenTbl.js";
import Theatre from "../models/Theatre.js";
import { asyncHandler, AppError } from "../services/errorService.js";

export const getTheatreScreensPublic = asyncHandler(async (req, res) => {
  const { theatreId } = req.params;

  if (!theatreId) {
    throw new AppError("Theatre ID is required", 400);
  }

  const theatre = await Theatre.findOne({
    _id: theatreId,
    approval_status: "approved",
  });

  if (!theatre) {
    throw new AppError("Theatre not found or not available", 404);
  }

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
    theatre: {
      _id: theatre._id,
      name: theatre.name,
      location: theatre.location,
    },
  });
});

export const getScreenDetailsPublic = asyncHandler(async (req, res) => {
  const { screenId } = req.params;

  if (!screenId) {
    throw new AppError("Screen ID is required", 400);
  }

  const screen = await ScreenTbl.findOne({
    _id: screenId,
    isActive: true,
    status: "active",
  })
    .populate("theatre", "name location address city approval_status disabled")
    .select("name screenNumber seatLayout seatTiers isActive status");

  if (!screen) {
    throw new AppError("Screen not found or not available", 404);
  }

  if (
    screen.theatre &&
    (screen.theatre.approval_status !== "approved" || screen.theatre.disabled)
  ) {
    throw new AppError("Theatre not available", 400);
  }

  res.json({ success: true, screen });
});

export const getScreensByManagerPublic = asyncHandler(async (req, res) => {
  const { managerId } = req.params;

  if (!managerId) {
    throw new AppError("Manager ID is required", 400);
  }

  const theatre = await Theatre.findOne({
    manager_id: managerId,
    approval_status: "approved",
    disabled: false,
  });

  if (!theatre) {
    throw new AppError("Theatre not found or not available", 404);
  }

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
    theatre: {
      _id: theatre._id,
      name: theatre.name,
      location: theatre.location,
    },
  });
});

export const createSeatCategory = asyncHandler(async (req, res) => {
  throw new AppError("Seat categories not implemented", 501);
});

export const getAllSeatCategories = asyncHandler(async (req, res) => {
  throw new AppError("Seat categories not implemented", 501);
});

export const createSeats = asyncHandler(async (req, res) => {
  throw new AppError("Seat creation not implemented", 501);
});

export const getAllSeats = asyncHandler(async (req, res) => {
  throw new AppError("Seat listing not implemented", 501);
});

export const getSeatsByScreen = asyncHandler(async (req, res) => {
  throw new AppError("Seat by screen not implemented", 501);
});

export const updateSeat = asyncHandler(async (req, res) => {
  throw new AppError("Seat update not implemented", 501);
});

export const deleteSeat = asyncHandler(async (req, res) => {
  throw new AppError("Seat deletion not implemented", 501);
});

export default {
  getTheatreScreensPublic,
  getScreenDetailsPublic,
  getScreensByManagerPublic,
  createSeatCategory,
  getAllSeatCategories,
  createSeats,
  getAllSeats,
  getSeatsByScreen,
  updateSeat,
  deleteSeat,
};
