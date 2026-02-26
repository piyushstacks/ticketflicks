import Theater from "../models/Theater_new.js";
import User from "../models/User_new.js";

// Create new theater
export const createTheater = async (req, res) => {
  try {
    const { name, location, u_id, contact_no } = req.body;

    if (!name || !location || !u_id) {
      return res.json({
        success: false,
        message: "Please provide name, location, and u_id (manager user id)",
      });
    }

    // Verify user exists and is a manager
    const user = await User.findById(u_id);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    if (user.role !== "manager" && user.role !== "admin") {
      return res.json({
        success: false,
        message: "User must be a manager or admin to manage a theater",
      });
    }

    const theater = await Theater.create({
      name,
      location,
      u_id,
      contact_no,
      isDeleted: false,
    });

    res.json({
      success: true,
      message: "Theater created successfully",
      theater,
    });
  } catch (error) {
    console.error("[createTheater]", error);
    res.json({ success: false, message: error.message });
  }
};

// Get all theaters
export const getAllTheaters = async (req, res) => {
  try {
    const { status, disabled } = req.query;
    
    let filter = { isDeleted: false };
    
    if (status) {
      filter.approval_status = status;
    }
    
    if (disabled !== undefined) {
      filter.disabled = disabled === 'true';
    }
    
    const theaters = await Theater.find(filter)
      .populate("u_id", "name email")
      .sort({ createdAt: -1 });

    res.json({ success: true, theaters });
  } catch (error) {
    console.error("[getAllTheaters]", error);
    res.json({ success: false, message: error.message });
  }
};

// Get theater by ID
export const getTheater = async (req, res) => {
  try {
    const { theaterId } = req.params;

    const theater = await Theater.findById(theaterId).populate(
      "u_id",
      "name email"
    );

    if (!theater || theater.isDeleted) {
      return res.json({
        success: false,
        message: "Theater not found or deleted",
      });
    }

    res.json({ success: true, theater });
  } catch (error) {
    console.error("[getTheater]", error);
    res.json({ success: false, message: error.message });
  }
};

// Update theater
export const updateTheater = async (req, res) => {
  try {
    const { theaterId } = req.params;
    const { name, location, contact_no, isDeleted } = req.body;

    const theater = await Theater.findById(theaterId);
    if (!theater) {
      return res.json({ success: false, message: "Theater not found" });
    }

    if (name) theater.name = name;
    if (location) theater.location = location;
    if (contact_no) theater.contact_no = contact_no;
    if (isDeleted !== undefined) theater.isDeleted = isDeleted;

    await theater.save();

    res.json({
      success: true,
      message: "Theater updated successfully",
      theater,
    });
  } catch (error) {
    console.error("[updateTheater]", error);
    res.json({ success: false, message: error.message });
  }
};

// Soft delete theater
export const deleteTheater = async (req, res) => {
  try {
    const { theaterId } = req.params;

    const theater = await Theater.findById(theaterId);
    if (!theater) {
      return res.json({ success: false, message: "Theater not found" });
    }

    theater.isDeleted = true;
    await theater.save();

    res.json({
      success: true,
      message: "Theater soft deleted successfully",
    });
  } catch (error) {
    console.error("[deleteTheater]", error);
    res.json({ success: false, message: error.message });
  }
};

// Get theaters by manager
export const getTheatersByManager = async (req, res) => {
  try {
    const { userId } = req.params;

    const theaters = await Theater.find({ u_id: userId, isDeleted: false })
      .populate("u_id", "name email")
      .sort({ createdAt: -1 });

    res.json({ success: true, theaters });
  } catch (error) {
    console.error("[getTheatersByManager]", error);
    res.json({ success: false, message: error.message });
  }
};

export default {
  createTheater,
  getAllTheaters,
  getTheater,
  updateTheater,
  deleteTheater,
  getTheatersByManager,
};
