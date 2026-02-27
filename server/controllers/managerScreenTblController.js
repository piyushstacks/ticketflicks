import ScreenTbl from "../models/ScreenTbl.js";
import Theatre from "../models/Theatre.js";
import User from "../models/User.js";
import Show from "../models/show_tbls.js";
import mongoose from "mongoose";

// Seat tier code to name mapping
const SEAT_CODE_TO_NAME = {
  S: "Standard",
  D: "Deluxe",
  P: "Premium",
  R: "Recliner",
  C: "Couple",
};

// Convert pricing object to seatTiers array
const convertPricingToSeatTiers = (pricing, seatLayout) => {
  if (!pricing) return [];

  const seatTiers = [];

  // Get unique seat codes from layout
  const tiersInLayout = new Set();
  if (seatLayout?.layout && Array.isArray(seatLayout.layout)) {
    seatLayout.layout.flat().forEach((seat) => {
      if (seat && seat !== "") tiersInLayout.add(seat);
    });
  }

  // If unified pricing, apply same price to all tiers
  if (pricing.unified !== undefined) {
    const price = parseFloat(pricing.unified) || 150;

    tiersInLayout.forEach((code) => {
      const tierName = SEAT_CODE_TO_NAME[code] || "Standard";

      // Find which rows have this tier
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
    // Tier-based pricing
    Object.entries(pricing).forEach(([code, config]) => {
      if (code === "unified") return;

      const tierName = SEAT_CODE_TO_NAME[code] || code;
      const price = parseFloat(config?.price || config) || 150;

      // Find which rows have this tier
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

// Get all screens for manager's theatre
export const getTheatreScreensTbl = async (req, res) => {
  try {
    const manager = await User.findById(req.user.id);
    if (!manager || manager.role !== "manager") {
      return res.json({
        success: false,
        message: "Unauthorized - Manager access required",
      });
    }

    const theatreId = manager.managedTheatreId;

    const screens = await ScreenTbl.find({
      theatre: theatreId,
    })
      .select('name screenNumber theatre seatLayout seatTiers isActive status createdBy lastModifiedBy created_at updated_at')
      .populate("theatre", "name location")
      .populate("createdBy", "name email")
      .populate("lastModifiedBy", "name email")
      .sort({ created_at: -1 })
      .lean();

    console.log("[getTheatreScreensTbl] Fetched screens with seatTiers:", screens.map(s => ({ 
      name: s.name, 
      seatTiersCount: s.seatTiers?.length || 0,
      seatTiers: s.seatTiers 
    })));

    res.json({ success: true, screens });
  } catch (error) {
    console.error("[getTheatreScreensTbl]", error);
    res.json({ success: false, message: error.message });
  }
};

// Add new screen to SCREEN_TBL
export const addScreenTbl = async (req, res) => {
  try {
    const manager = await User.findById(req.user.id);
    if (!manager || manager.role !== "manager") {
      return res.json({
        success: false,
        message: "Unauthorized - Manager access required",
      });
    }

    const theatreId = manager.managedTheatreId;
    const {
      name,
      screenNumber,
      seatLayout,
      seatTiers,
      pricing,
      status = "active",
    } = req.body;

    if (!name || !screenNumber || !seatLayout) {
      return res.json({
        success: false,
        message: "Name, Screen Number, and Seat Layout are required",
      });
    }

    // Validate theatre exists and belongs to this manager
    const theatre = await Theatre.findOne({
      _id: theatreId,
      manager_id: manager._id,
    });

    if (!theatre) {
      return res.json({
        success: false,
        message: "Theatre not found or unauthorized access",
      });
    }

    // Check if screen name already exists for this theatre
    const existingScreen = await ScreenTbl.findOne({
      name,
      theatre: theatreId,
    });

    if (existingScreen) {
      return res.json({
        success: false,
        message: "Screen with this name already exists for your theatre",
      });
    }

    // Convert pricing to seatTiers if seatTiers not provided
    let finalSeatTiers = seatTiers;
    if (!seatTiers || seatTiers.length === 0) {
      if (pricing) {
        finalSeatTiers = convertPricingToSeatTiers(pricing, seatLayout);
      } else {
        // Default pricing based on layout
        finalSeatTiers = convertPricingToSeatTiers(
          { unified: 150 },
          seatLayout,
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
      status,
      createdBy: manager._id,
      lastModifiedBy: manager._id,
    });

    await newScreen.save();

    const populatedScreen = await ScreenTbl.findById(newScreen._id)
      .populate("theatre", "name location")
      .populate("createdBy", "name email");

    res.json({
      success: true,
      message: "Screen added successfully",
      screen: populatedScreen,
    });
  } catch (error) {
    console.error("[addScreenTbl]", error);
    res.json({ success: false, message: error.message });
  }
};

// Edit screen in SCREEN_TBL
export const editScreenTbl = async (req, res) => {
  try {
    const manager = await User.findById(req.user.id);
    if (!manager || manager.role !== "manager") {
      return res.json({
        success: false,
        message: "Unauthorized - Manager access required",
      });
    }

    const { screenId } = req.params;
    const { name, screenNumber, seatLayout, seatTiers, pricing, status } =
      req.body;

    // Find the screen and verify it belongs to manager's theatre
    const screen = await ScreenTbl.findOne({
      _id: screenId,
      theatre: manager.managedTheatreId,
    });

    if (!screen) {
      return res.json({
        success: false,
        message: "Screen not found or unauthorized access",
      });
    }

    // Check if name conflicts with another screen
    if (name && name !== screen.name) {
      const nameConflict = await ScreenTbl.findOne({
        name,
        theatre: screen.theatre,
        _id: { $ne: screenId },
      });

      if (nameConflict) {
        return res.json({
          success: false,
          message: "Another screen with this name already exists",
        });
      }
    }

    // Update screen fields
    if (name) screen.name = name;
    if (screenNumber) screen.screenNumber = screenNumber;
    if (seatLayout) screen.seatLayout = seatLayout;

    // Handle seatTiers - convert from pricing if needed
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
    screen.lastModifiedBy = manager._id;

    await screen.save();

    const updatedScreen = await ScreenTbl.findById(screen._id)
      .populate("theatre", "name location")
      .populate("lastModifiedBy", "name email");

    res.json({
      success: true,
      message: "Screen updated successfully",
      screen: updatedScreen,
    });
  } catch (error) {
    console.error("[editScreenTbl]", error);
    res.json({ success: false, message: error.message });
  }
};

// Toggle screen status in SCREEN_TBL
export const toggleScreenStatusTbl = async (req, res) => {
  try {
    const manager = await User.findById(req.user.id);
    if (!manager || manager.role !== "manager") {
      return res.json({
        success: false,
        message: "Unauthorized - Manager access required",
      });
    }

    const { screenId } = req.params;

    const screen = await ScreenTbl.findOne({
        _id: screenId,
        theatre: manager.managedTheatreId,
      });

    if (!screen) {
      return res.json({
        success: false,
        message: "Screen not found or unauthorized access",
      });
    }

    // Toggle between active and inactive
    const newStatus = screen.status === "active" ? "inactive" : "active";
    screen.status = newStatus;
    screen.isActive = newStatus === "active";
    screen.lastModifiedBy = manager._id;

    await screen.save();

    const updatedScreen = await ScreenTbl.findById(screen._id)
      .populate("theatre", "name location")
      .populate("lastModifiedBy", "name email");

    res.json({
      success: true,
      message: `Screen ${newStatus === "active" ? "enabled" : "disabled"} successfully`,
      screen: updatedScreen,
    });
  } catch (error) {
    console.error("[toggleScreenStatusTbl]", error);
    res.json({ success: false, message: error.message });
  }
};

// Delete screen from SCREEN_TBL
export const deleteScreenTbl = async (req, res) => {
  try {
    const manager = await User.findById(req.user.id);
    if (!manager || manager.role !== "manager") {
      return res.json({
        success: false,
        message: "Unauthorized - Manager access required",
      });
    }

    const { screenId } = req.params;

    const screen = await ScreenTbl.findOne({
      _id: screenId,
      theatre: manager.managedTheatreId,
    });

    if (!screen) {
      return res.json({
        success: false,
        message: "Screen not found or unauthorized access",
      });
    }

    // Check if there are any active shows for this screen
    const activeShows = await Show.countDocuments({
      screen: screenId,
      isActive: true,
    });

    if (activeShows > 0) {
      return res.json({
        success: false,
        message:
          "Cannot delete screen with active shows. Please disable shows first.",
      });
    }

    await ScreenTbl.findByIdAndDelete(screenId);

    res.json({
      success: true,
      message: "Screen deleted successfully",
    });
  } catch (error) {
    console.error("[deleteScreenTbl]", error);
    res.json({ success: false, message: error.message });
  }
};

// Get single screen details
export const getScreenTblById = async (req, res) => {
  try {
    const manager = await User.findById(req.user.id);
    if (!manager || manager.role !== "manager") {
      return res.json({
        success: false,
        message: "Unauthorized - Manager access required",
      });
    }

    const { screenId } = req.params;

    const screen = await ScreenTbl.findOne({
      _id: screenId,
      theatre: manager.managedTheatreId,
    })
      .populate("theatre", "name location")
      .populate("createdBy", "name email")
      .populate("lastModifiedBy", "name email");

    if (!screen) {
      return res.json({
        success: false,
        message: "Screen not found or unauthorized access",
      });
    }

    res.json({ success: true, screen });
  } catch (error) {
    console.error("[getScreenTblById]", error);
    res.json({ success: false, message: error.message });
  }
};
