import ScreenTbl from "../models/ScreenTbl.js";
import Theatre from "../models/Theatre.js";
import User from "../models/User.js";
import Show from "../models/show_tbls.js";
import { AppError } from "./errorService.js";

const SEAT_CODE_TO_NAME = {
  S: "Standard",
  D: "Deluxe",
  P: "Premium",
  R: "Recliner",
  C: "Couple",
};

const convertPricingToSeatTiers = (pricing, seatLayout) => {
  if (!pricing) return [];

  const seatTiers = [];
  const tiersInLayout = new Set();

  if (seatLayout?.layout && Array.isArray(seatLayout.layout)) {
    seatLayout.layout.flat().forEach((seat) => {
      if (seat && seat !== "") tiersInLayout.add(seat);
    });
  }

  if (pricing.unified !== undefined) {
    const price = parseFloat(pricing.unified) || 150;

    tiersInLayout.forEach((code) => {
      const tierName = SEAT_CODE_TO_NAME[code] || "Standard";
      const rows = [];

      if (seatLayout?.layout) {
        seatLayout.layout.forEach((row, idx) => {
          if (row.some((seat) => seat === code)) {
            rows.push(String.fromCharCode(65 + idx));
          }
        });
      }

      seatTiers.push({
        tierName,
        price,
        rows,
        seatsPerRow: seatLayout?.seatsPerRow || 10,
      });
    });
  } else {
    Object.entries(pricing).forEach(([code, config]) => {
      if (code === "unified") return;

      const tierName = SEAT_CODE_TO_NAME[code] || code;
      const price = parseFloat(config?.price || config) || 150;
      const rows = [];

      if (seatLayout?.layout) {
        seatLayout.layout.forEach((row, idx) => {
          if (row.some((seat) => seat === code)) {
            rows.push(String.fromCharCode(65 + idx));
          }
        });
      }

      seatTiers.push({
        tierName,
        price,
        rows,
        seatsPerRow: seatLayout?.seatsPerRow || 10,
      });
    });
  }

  return seatTiers;
};

export const getManagerTheatre = async (managerId) => {
  const manager = await User.findById(managerId);

  if (!manager || manager.role !== "manager") {
    throw new AppError("Unauthorized - Manager access required", 403);
  }

  return manager.managedTheatreId;
};

export const getTheatreScreens = async (managerId) => {
  const theatreId = await getManagerTheatre(managerId);

  const screens = await ScreenTbl.find({
    theatre: theatreId,
  })
    .select(
      "name screenNumber theatre seatLayout seatTiers isActive status createdBy lastModifiedBy created_at updated_at"
    )
    .populate("theatre", "name location")
    .populate("createdBy", "name email")
    .populate("lastModifiedBy", "name email")
    .sort({ created_at: -1 })
    .lean();

  return screens;
};

export const addScreen = async (managerId, screenData) => {
  const { name, screenNumber, seatLayout, seatTiers, pricing, status } =
    screenData;
  const theatreId = await getManagerTheatre(managerId);

  if (!name || !screenNumber || !seatLayout) {
    throw new AppError(
      "Name, Screen Number, and Seat Layout are required",
      400
    );
  }

  const theatre = await Theatre.findOne({
    _id: theatreId,
    manager_id: managerId,
  });

  if (!theatre) {
    throw new AppError("Theatre not found or unauthorized access", 404);
  }

  const existingScreen = await ScreenTbl.findOne({
    name,
    theatre: theatreId,
  });

  if (existingScreen) {
    throw new AppError(
      "Screen with this name already exists for your theatre",
      409
    );
  }

  let finalSeatTiers = seatTiers;
  if (!seatTiers || seatTiers.length === 0) {
    if (pricing) {
      finalSeatTiers = convertPricingToSeatTiers(pricing, seatLayout);
    } else {
      finalSeatTiers = convertPricingToSeatTiers(
        { unified: 150 },
        seatLayout
      );
    }
  }

  const newScreen = new ScreenTbl({
    name,
    screenNumber,
    theatre: theatreId,
    seatLayout,
    seatTiers: finalSeatTiers,
    isActive: status === "active",
    status: status || "active",
    createdBy: managerId,
    lastModifiedBy: managerId,
  });

  await newScreen.save();

  const populatedScreen = await ScreenTbl.findById(newScreen._id)
    .populate("theatre", "name location")
    .populate("createdBy", "name email");

  return populatedScreen;
};

export const updateScreen = async (managerId, screenId, updateData) => {
  const { name, screenNumber, seatLayout, seatTiers, pricing, status } =
    updateData;
  const theatreId = await getManagerTheatre(managerId);

  const screen = await ScreenTbl.findOne({
    _id: screenId,
    theatre: theatreId,
  });

  if (!screen) {
    throw new AppError("Screen not found or unauthorized access", 404);
  }

  if (name && name !== screen.name) {
    const nameConflict = await ScreenTbl.findOne({
      name,
      theatre: screen.theatre,
      _id: { $ne: screenId },
    });

    if (nameConflict) {
      throw new AppError("Another screen with this name already exists", 409);
    }
  }

  if (name) screen.name = name;
  if (screenNumber) screen.screenNumber = screenNumber;
  if (seatLayout) screen.seatLayout = seatLayout;

  if (seatTiers && seatTiers.length > 0) {
    screen.seatTiers = seatTiers;
  } else if (pricing) {
    const layoutToUse = seatLayout || screen.seatLayout;
    screen.seatTiers = convertPricingToSeatTiers(pricing, layoutToUse);
  }

  if (status) {
    screen.status = status;
    screen.isActive = status === "active";
  }

  screen.lastModifiedBy = managerId;
  await screen.save();

  const updatedScreen = await ScreenTbl.findById(screen._id)
    .populate("theatre", "name location")
    .populate("lastModifiedBy", "name email");

  return updatedScreen;
};

export const toggleScreenStatus = async (managerId, screenId) => {
  const theatreId = await getManagerTheatre(managerId);

  const screen = await ScreenTbl.findOne({
    _id: screenId,
    theatre: theatreId,
  });

  if (!screen) {
    throw new AppError("Screen not found or unauthorized access", 404);
  }

  const newStatus = screen.status === "active" ? "inactive" : "active";
  screen.status = newStatus;
  screen.isActive = newStatus === "active";
  screen.lastModifiedBy = managerId;

  await screen.save();

  const updatedScreen = await ScreenTbl.findById(screen._id)
    .populate("theatre", "name location")
    .populate("lastModifiedBy", "name email");

  return updatedScreen;
};

export const deleteScreen = async (managerId, screenId) => {
  const theatreId = await getManagerTheatre(managerId);

  const screen = await ScreenTbl.findOne({
    _id: screenId,
    theatre: theatreId,
  });

  if (!screen) {
    throw new AppError("Screen not found or unauthorized access", 404);
  }

  const activeShows = await Show.countDocuments({
    screen: screenId,
    isActive: true,
  });

  if (activeShows > 0) {
    throw new AppError(
      "Cannot delete screen with active shows. Please disable shows first.",
      400
    );
  }

  await ScreenTbl.findByIdAndDelete(screenId);

  return { message: "Screen deleted successfully" };
};

export const getScreenById = async (managerId, screenId) => {
  const theatreId = await getManagerTheatre(managerId);

  const screen = await ScreenTbl.findOne({
    _id: screenId,
    theatre: theatreId,
  })
    .populate("theatre", "name location")
    .populate("createdBy", "name email")
    .populate("lastModifiedBy", "name email");

  if (!screen) {
    throw new AppError("Screen not found or unauthorized access", 404);
  }

  return screen;
};
