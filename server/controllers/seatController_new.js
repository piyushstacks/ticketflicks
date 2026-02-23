import Seat from "../models/Seat.js";
import SeatCategory from "../models/SeatCategory.js";
import Screen from "../models/Screen_new.js";

// Create seat category
export const createSeatCategory = async (req, res) => {
  try {
    const { name, price, description } = req.body;

    if (!name || price === undefined) {
      return res.json({
        success: false,
        message: "Please provide name and price",
      });
    }

    const category = await SeatCategory.create({
      name,
      price,
      description,
    });

    res.json({
      success: true,
      message: "Seat category created successfully",
      category,
    });
  } catch (error) {
    console.error("[createSeatCategory]", error);
    res.json({ success: false, message: error.message });
  }
};

// Get all seat categories
export const getAllSeatCategories = async (req, res) => {
  try {
    const categories = await SeatCategory.find().sort({ price: 1 });
    res.json({ success: true, categories });
  } catch (error) {
    console.error("[getAllSeatCategories]", error);
    res.json({ success: false, message: error.message });
  }
};

// Create seats for a screen
export const createSeats = async (req, res) => {
  try {
    const { screen_id, category_id, seat_codes } = req.body;

    if (!screen_id || !category_id || !seat_codes || !Array.isArray(seat_codes)) {
      return res.json({
        success: false,
        message: "Please provide screen_id, category_id, and seat_codes array",
      });
    }

    // Verify screen exists
    const screen = await Screen.findById(screen_id);
    if (!screen || screen.isDeleted) {
      return res.json({
        success: false,
        message: "Screen not found or deleted",
      });
    }

    // Verify category exists
    const category = await SeatCategory.findById(category_id);
    if (!category) {
      return res.json({ success: false, message: "Seat category not found" });
    }

    const seat = await Seat.create({
      screen_id,
      category_id,
      seat_codes,
    });

    await seat.populate("screen_id category_id");

    res.json({
      success: true,
      message: "Seats created successfully",
      seat,
    });
  } catch (error) {
    console.error("[createSeats]", error);
    res.json({ success: false, message: error.message });
  }
};

// Get seats by screen
export const getSeatsByScreen = async (req, res) => {
  try {
    const { screenId } = req.params;

    const seats = await Seat.find({ screen_id: screenId })
      .populate("category_id", "name price")
      .populate("screen_id", "name capacity");

    res.json({ success: true, seats });
  } catch (error) {
    console.error("[getSeatsByScreen]", error);
    res.json({ success: false, message: error.message });
  }
};

// Get all seats
export const getAllSeats = async (req, res) => {
  try {
    const seats = await Seat.find()
      .populate("category_id")
      .populate({
        path: "screen_id",
        populate: { path: "Tid", select: "name location" },
      });

    res.json({ success: true, seats });
  } catch (error) {
    console.error("[getAllSeats]", error);
    res.json({ success: false, message: error.message });
  }
};

// Update seat
export const updateSeat = async (req, res) => {
  try {
    const { seatId } = req.params;
    const { category_id, seat_codes } = req.body;

    const seat = await Seat.findById(seatId);
    if (!seat) {
      return res.json({ success: false, message: "Seat not found" });
    }

    if (category_id) seat.category_id = category_id;
    if (seat_codes) seat.seat_codes = seat_codes;

    await seat.save();
    await seat.populate("category_id screen_id");

    res.json({ success: true, message: "Seat updated successfully", seat });
  } catch (error) {
    console.error("[updateSeat]", error);
    res.json({ success: false, message: error.message });
  }
};

// Delete seat
export const deleteSeat = async (req, res) => {
  try {
    const { seatId } = req.params;

    const seat = await Seat.findByIdAndDelete(seatId);
    if (!seat) {
      return res.json({ success: false, message: "Seat not found" });
    }

    res.json({ success: true, message: "Seat deleted successfully" });
  } catch (error) {
    console.error("[deleteSeat]", error);
    res.json({ success: false, message: error.message });
  }
};

export default {
  createSeatCategory,
  getAllSeatCategories,
  createSeats,
  getSeatsByScreen,
  getAllSeats,
  updateSeat,
  deleteSeat,
};
