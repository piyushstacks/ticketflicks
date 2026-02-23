import Screen from "../models/Screen_new.js";
import Theater from "../models/Theater_new.js";

// Create new screen
export const createScreen = async (req, res) => {
  try {
    const { Tid, name, capacity } = req.body;

    if (!Tid || !name || !capacity) {
      return res.json({
        success: false,
        message: "Please provide Tid (theater id), name, and capacity",
      });
    }

    // Verify theater exists
    const theater = await Theater.findById(Tid);
    if (!theater || theater.isDeleted) {
      return res.json({
        success: false,
        message: "Theater not found or deleted",
      });
    }

    const screen = await Screen.create({
      Tid,
      name,
      capacity,
      isDeleted: false,
    });

    res.json({
      success: true,
      message: "Screen created successfully",
      screen,
    });
  } catch (error) {
    console.error("[createScreen]", error);
    res.json({ success: false, message: error.message });
  }
};

// Get all screens
export const getAllScreens = async (req, res) => {
  try {
    const screens = await Screen.find({ isDeleted: false })
      .populate("Tid", "name location")
      .sort({ createdAt: -1 });

    res.json({ success: true, screens });
  } catch (error) {
    console.error("[getAllScreens]", error);
    res.json({ success: false, message: error.message });
  }
};

// Get screens by theater
export const getScreensByTheater = async (req, res) => {
  try {
    const { theaterId } = req.params;

    const screens = await Screen.find({ Tid: theaterId, isDeleted: false })
      .populate("Tid", "name location")
      .sort({ name: 1 });

    res.json({ success: true, screens });
  } catch (error) {
    console.error("[getScreensByTheater]", error);
    res.json({ success: false, message: error.message });
  }
};

// Get screen by ID
export const getScreen = async (req, res) => {
  try {
    const { screenId } = req.params;

    const screen = await Screen.findById(screenId).populate(
      "Tid",
      "name location"
    );

    if (!screen || screen.isDeleted) {
      return res.json({
        success: false,
        message: "Screen not found or deleted",
      });
    }

    res.json({ success: true, screen });
  } catch (error) {
    console.error("[getScreen]", error);
    res.json({ success: false, message: error.message });
  }
};

// Update screen
export const updateScreen = async (req, res) => {
  try {
    const { screenId } = req.params;
    const { name, capacity, isDeleted } = req.body;

    const screen = await Screen.findById(screenId);
    if (!screen) {
      return res.json({ success: false, message: "Screen not found" });
    }

    if (name) screen.name = name;
    if (capacity) screen.capacity = capacity;
    if (isDeleted !== undefined) screen.isDeleted = isDeleted;

    await screen.save();

    res.json({
      success: true,
      message: "Screen updated successfully",
      screen,
    });
  } catch (error) {
    console.error("[updateScreen]", error);
    res.json({ success: false, message: error.message });
  }
};

// Soft delete screen
export const deleteScreen = async (req, res) => {
  try {
    const { screenId } = req.params;

    const screen = await Screen.findById(screenId);
    if (!screen) {
      return res.json({ success: false, message: "Screen not found" });
    }

    screen.isDeleted = true;
    await screen.save();

    res.json({ success: true, message: "Screen soft deleted successfully" });
  } catch (error) {
    console.error("[deleteScreen]", error);
    res.json({ success: false, message: error.message });
  }
};

export default {
  createScreen,
  getAllScreens,
  getScreensByTheater,
  getScreen,
  updateScreen,
  deleteScreen,
};
