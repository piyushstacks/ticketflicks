import Theatre from "../models/Theatre.js";
import User from "../models/User.js";
import Otp from "../models/Otp.js";
import bcryptjs from "bcryptjs";
import sendEmail from "../configs/nodeMailer.js";

// Password validation constants
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// OTP constants for theatre registration
const THEATRE_OTP_TTL_MS = 2 * 60 * 1000; // 2 minutes

// Validate password strength
const validatePassword = (password) => {
  if (!password || password.length < PASSWORD_MIN_LENGTH) {
    return { valid: false, message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters long` };
  }
  if (!PASSWORD_REGEX.test(password)) {
    return { valid: false, message: "Password must contain at least 1 uppercase, 1 lowercase, 1 digit, and 1 special character (@$!%*?&)" };
  }
  return { valid: true };
};

// Request OTP for theatre registration
export const requestTheatreRegistrationOtp = async (req, res) => {
  try {
    console.log("=== THEATRE REGISTRATION OTP REQUEST ===");
    console.log("Request body:", req.body);
    console.log("Email from request:", req.body.email);
    
    const { email } = req.body;
    if (!email) {
      console.log("ERROR: Email is required");
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const normalizedEmail = email.toLowerCase();
    console.log("Normalized email:", normalizedEmail);

    // Check if email already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      console.log("ERROR: Email already registered");
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    // Delete any existing OTPs for this email
    await Otp.deleteMany({ email: normalizedEmail, purpose: "theatre-registration" });

    const otp = ("000000" + Math.floor(Math.random() * 999999)).slice(-6);
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[dev-otp] theatre-registration OTP for ${normalizedEmail}: ${otp}`);
    }
    const otpHash = await bcryptjs.hash(otp, 10);
    const expiresAt = new Date(Date.now() + THEATRE_OTP_TTL_MS);

    await Otp.create({ email: normalizedEmail, otpHash, purpose: "theatre-registration", expiresAt });

    const subject = "Your Theatre Registration OTP";
    const body = `<p>Your theatre registration OTP is <strong>${otp}</strong>. It expires in 2 minutes.</p>`;

    // Always try to send email (both dev and production)
    try {
      console.log("Attempting to send email...");
      await sendEmail({
        to: normalizedEmail,
        subject,
        body,
      });
      console.log(`[nodeMailer] message sent for theatre registration`);
    } catch (emailError) {
      console.error("[nodeMailer] sendEmail error:", emailError);
      // In development, continue even if email fails
      if (process.env.NODE_ENV === 'production') {
        return res.status(500).json({ 
          success: false, 
          message: "Failed to send OTP email" 
        });
      } else {
        console.log("Continuing in development mode despite email error");
      }
    }

    console.log("SUCCESS: OTP sent successfully");
    res.json({ success: true, message: "OTP sent to your email" });
  } catch (error) {
    console.error("=== THEATRE OTP REQUEST ERROR ===");
    console.error("Error sending theatre registration OTP:", error);
    res.status(500).json({ success: false, message: "Failed to send OTP" });
  }
};

// Register a new theatre
export const registerTheatre = async (req, res) => {
  try {
    const { manager, theatre, screens, otp } = req.body;

    // Debug logging
    console.log("Theatre registration request:", {
      manager: manager ? { name: manager.name, email: manager.email } : null,
      theatre: theatre ? { name: theatre.name, location: theatre.location } : null,
      screens: screens ? screens.length : 0,
      hasOtp: !!otp
    });

    // Validation
    if (!manager || !theatre || !screens || screens.length === 0 || !otp) {
      return res.status(400).json({
        success: false,
        message: "Manager info, theatre details, OTP, and at least one screen are required",
      });
    }

    // Validate manager data
    const { name, email, phone, password } = manager;
    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "All manager fields (name, email, phone, password) are required",
      });
    }

    const normalizedEmail = email.toLowerCase();

    // Verify OTP
    const otpDoc = await Otp.findOne({ 
      email: normalizedEmail, 
      purpose: "theatre-registration", 
      expiresAt: { $gte: new Date() } 
    }).sort({ createdAt: -1 });

    if (!otpDoc) {
      return res.status(400).json({ success: false, message: "OTP expired or not found" });
    }

    const match = await bcryptjs.compare(otp, otpDoc.otpHash);
    if (!match) return res.status(400).json({ success: false, message: "Invalid OTP" });

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.message,
      });
    }

    // Check if manager email already exists
    const existingManager = await User.findOne({ email: normalizedEmail });
    if (existingManager) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Validate theatre data
    const { name: theatreName, location, contact_no } = theatre;
    if (!theatreName || !location || !contact_no) {
      return res.status(400).json({
        success: false,
        message: "All theatre fields (name, location, contact_no) are required",
      });
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create new manager user
    // Note: User schema expects `password_hash` property (required), not `password`.
    const newManager = new User({
      name,
      email: normalizedEmail,
      phone,
      password_hash: hashedPassword,
      role: "manager",
    });

    const savedManager = await newManager.save();

    // Create screen documents and prepare theatre screens array
    const theatreScreens = screens.map((screen, index) => {
      console.log(`Processing screen ${index + 1}:`, {
        name: screen.name,
        hasLayout: !!screen.layout,
        hasPricing: !!screen.pricing,
        layoutKeys: screen.layout ? Object.keys(screen.layout) : null
      });

      if (!screen.name || !screen.layout || !screen.pricing) {
        throw new Error(`Screen ${index + 1} is missing required fields (name, layout, or pricing)`);
      }

      return {
        name: screen.name,
        layout: screen.layout,
        pricing: screen.pricing,
        totalSeats: screen.layout?.totalSeats || 0,
        status: 'active'
      };
    });

    // Create theatre
    const newTheatre = new Theatre({
      name: theatreName,
      location,
      contact_no,
      manager_id: savedManager._id,
      screens: theatreScreens,
    });

    await newTheatre.save();

    // Delete all OTPs for this email after successful registration
    await Otp.deleteMany({ email: normalizedEmail, purpose: "theatre-registration" });

    res.status(201).json({
      success: true,
      message: "Theatre registered successfully",
      data: {
        manager: {
          id: savedManager._id,
          name: savedManager.name,
          email: savedManager.email,
          phone: savedManager.phone,
          role: savedManager.role,
        },
        theatre: newTheatre,
      },
    });
  } catch (error) {
    console.error("Error registering theatre:", error);
    res.status(500).json({
      success: false,
      message: "Error registering theatre",
      error: error.message,
    });
  }
};

// Fetch all theatres
export const fetchAllTheatres = async (req, res) => {
  try {
    const theatres = await Theatre.find().populate("manager_id", "name email phone");
    res.status(200).json({
      success: true,
      theatres,
    });
  } catch (error) {
    console.error("Error fetching theatres:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching theatres",
      error: error.message,
    });
  }
};

// Fetch theatre by ID
export const fetchTheatre = async (req, res) => {
  try {
    const { id } = req.params;
    const theatre = await Theatre.findById(id).populate("manager_id", "name email phone");

    if (!theatre) {
      return res.status(404).json({
        success: false,
        message: "Theatre not found",
      });
    }

    res.status(200).json({
      success: true,
      theatre,
    });
  } catch (error) {
    console.error("Error fetching theatre:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching theatre",
      error: error.message,
    });
  }
};

// Update theatre
export const updateTheatre = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location, contact_no, screens, address, city, state, zipCode, email } = req.body;

    // Validate that at least one screen exists
    if (screens && screens.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Theatre must have at least one screen",
      });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (location) updateData.location = location;
    if (contact_no) updateData.contact_no = contact_no;
    if (screens) updateData.screens = screens;
    if (address) updateData.address = address;
    if (city) updateData.city = city;
    if (state) updateData.state = state;
    if (zipCode) updateData.zipCode = zipCode;
    if (email) updateData.email = email;

    const theatre = await Theatre.findByIdAndUpdate(id, updateData, { new: true }).populate(
      "manager_id",
      "name email phone"
    );

    if (!theatre) {
      return res.status(404).json({
        success: false,
        message: "Theatre not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Theatre updated successfully",
      theatre,
    });
  } catch (error) {
    console.error("Error updating theatre:", error);
    res.status(500).json({
      success: false,
      message: "Error updating theatre",
      error: error.message,
    });
  }
};

// Add screen to theatre
export const addScreen = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, capacity, seat_layout } = req.body;

    if (!name || !capacity || !seat_layout) {
      return res.status(400).json({
        success: false,
        message: "Screen name, capacity, and seat layout are required",
      });
    }

    const theatre = await Theatre.findById(id);
    if (!theatre) {
      return res.status(404).json({
        success: false,
        message: "Theatre not found",
      });
    }

    theatre.screens.push({
      name,
      capacity,
      seat_layout,
    });

    await theatre.save();

    res.status(200).json({
      success: true,
      message: "Screen added successfully",
      theatre,
    });
  } catch (error) {
    console.error("Error adding screen:", error);
    res.status(500).json({
      success: false,
      message: "Error adding screen",
      error: error.message,
    });
  }
};

// Update screen in theatre
export const updateScreen = async (req, res) => {
  try {
    const { id, screenIndex } = req.params;
    const { name, capacity, seat_layout } = req.body;

    const theatre = await Theatre.findById(id);
    if (!theatre) {
      return res.status(404).json({
        success: false,
        message: "Theatre not found",
      });
    }

    if (screenIndex >= theatre.screens.length) {
      return res.status(404).json({
        success: false,
        message: "Screen not found",
      });
    }

    if (name) theatre.screens[screenIndex].name = name;
    if (capacity) theatre.screens[screenIndex].capacity = capacity;
    if (seat_layout) theatre.screens[screenIndex].seat_layout = seat_layout;

    await theatre.save();

    res.status(200).json({
      success: true,
      message: "Screen updated successfully",
      theatre,
    });
  } catch (error) {
    console.error("Error updating screen:", error);
    res.status(500).json({
      success: false,
      message: "Error updating screen",
      error: error.message,
    });
  }
};

// Delete screen from theatre
export const deleteScreen = async (req, res) => {
  try {
    const { id, screenIndex } = req.params;

    const theatre = await Theatre.findById(id);
    if (!theatre) {
      return res.status(404).json({
        success: false,
        message: "Theatre not found",
      });
    }

    if (theatre.screens.length === 1) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete the only screen. Theatre must have at least one screen.",
      });
    }

    if (screenIndex >= theatre.screens.length) {
      return res.status(404).json({
        success: false,
        message: "Screen not found",
      });
    }

    theatre.screens.splice(screenIndex, 1);
    await theatre.save();

    res.status(200).json({
      success: true,
      message: "Screen deleted successfully",
      theatre,
    });
  } catch (error) {
    console.error("Error deleting screen:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting screen",
      error: error.message,
    });
  }
};

// Get theatres by manager
export const getTheatresByManager = async (req, res) => {
  try {
    const { managerId } = req.params;
    console.log("Fetching theatres for manager ID:", managerId);
    
    // First check if manager exists
    const User = (await import("../models/User.js")).default;
    const manager = await User.findById(managerId);
    console.log("Manager found:", manager ? manager.name : "No manager found");
    
    if (!manager) {
      return res.status(404).json({
        success: false,
        message: "Manager not found",
      });
    }
    
    if (manager.role !== "manager") {
      return res.status(403).json({
        success: false,
        message: "User is not a manager",
      });
    }

    const theatres = await Theatre.find({ manager_id: managerId }).populate(
      "manager_id",
      "name email phone"
    );

    console.log("Found theatres:", theatres.length);
    if (theatres.length > 0) {
      theatres.forEach(t => {
        console.log("- Theatre:", t.name, "ID:", t._id.toString());
      });
    }

    res.status(200).json({
      success: true,
      theatres,
    });
  } catch (error) {
    console.error("Error fetching manager theatres:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching theatres",
      error: error.message,
    });
  }
};

// Delete theatre
export const deleteTheatre = async (req, res) => {
  try {
    const { id } = req.params;

    const theatre = await Theatre.findByIdAndDelete(id);

    if (!theatre) {
      return res.status(404).json({
        success: false,
        message: "Theatre not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Theatre deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting theatre:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting theatre",
      error: error.message,
    });
  }
};
