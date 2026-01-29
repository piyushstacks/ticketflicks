import Theatre from "../models/Theatre.js";
import User from "../models/User.js";
import Otp from "../models/Otp.js";
import Screen from "../models/Screen.js";
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
    
    // Handle specific error cases
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: "This email is already registered for theatre management." 
      });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: "Invalid email format. Please enter a valid email address."
      });
    }
    
    if (error.message && error.message.includes('timeout')) {
      return res.status(500).json({
        success: false,
        message: "Request is taking too long. Please try again."
      });
    }
    
    // Generic error with user-friendly message
    res.status(500).json({ 
      success: false, 
      message: "Unable to send OTP right now. Please try again in a few minutes." 
    });
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
    const { name: theatreName, location, contact_no, email: theatreEmail, address, city, state, zipCode } = theatre;
    if (!theatreName || !location) {
      return res.status(400).json({
        success: false,
        message: "Theatre name and location are required",
      });
    }

    // Validate contact number if provided
    if (contact_no && !/^\d{10}$/.test(contact_no)) {
      return res.status(400).json({
        success: false,
        message: "Contact number must be exactly 10 digits",
      });
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create new manager user but with pending status initially
    const newManager = new User({
      name,
      email: normalizedEmail,
      phone,
      password_hash: hashedPassword,
      role: "pending_manager", // Changed from "manager" to prevent login until approved
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

    // Create theatre with pending approval status
    const newTheatre = new Theatre({
      name: theatreName,
      location,
      contact_no,
      email: theatreEmail || '',
      address: address || '',
      city: city || '',
      state: state || '',
      zipCode: zipCode || '',
      manager_id: savedManager._id,
      screens: theatreScreens,
      approval_status: 'pending', // Set to pending until admin approval
    });

    const savedTheatre = await newTheatre.save();

    // Create Screen documents linked to the theatre
    const screenDocs = screens.map((screenData, index) => {
      console.log(`Processing screen ${index + 1}:`, {
        name: screenData.name,
        hasLayout: !!screenData.layout,
        hasPricing: !!screenData.pricing,
        layoutKeys: screenData.layout ? Object.keys(screenData.layout) : null
      });

      if (!screenData.name || !screenData.layout || !screenData.pricing) {
        throw new Error(`Screen ${index + 1} is missing required fields (name, layout, or pricing)`);
      }

      // Validate layout structure
      if (!screenData.layout.layout || !Array.isArray(screenData.layout.layout)) {
        throw new Error(`Screen ${index + 1} has invalid layout structure`);
      }

      // Generate row labels (A, B, C...)
      const rowLabels = [];
      for (let i = 0; i < screenData.layout.rows; i++) {
        // Handle > 26 rows (AA, AB...) if necessary, but simple A-Z is usually enough
        // Using simple generation for now
        let label = "";
        if (i < 26) {
          label = String.fromCharCode(65 + i);
        } else {
          label = "R" + (i + 1); // Fallback for very large screens
        }
        rowLabels.push(label);
      }

      let seatTiers = [];
      if (screenData.pricing.unified) {
        seatTiers.push({
          tierName: "Standard",
          price: Number(screenData.pricing.unified),
          rows: rowLabels,
          seatsPerRow: screenData.layout.seatsPerRow,
        });
      } else {
        // Group rows by tier code
        const tierGroups = {}; // code -> [rowLabels]

        screenData.layout.layout.forEach((rowSeats, rowIndex) => {
          // Find first non-empty seat to determine tier
          const firstSeat = rowSeats.find((s) => s && s !== "");
          if (firstSeat) {
            if (!tierGroups[firstSeat]) tierGroups[firstSeat] = [];
            tierGroups[firstSeat].push(rowLabels[rowIndex]);
          }
        });

        // Build seatTiers from groups
        for (const [code, rows] of Object.entries(tierGroups)) {
          // Get price from pricing object
          // pricing[code] is { price: 150, enabled: true }
          const tierPrice = screenData.pricing[code]?.price || 0;

          // Map code to descriptive name if possible (optional)
          const tierNames = {
            S: "Standard",
            D: "Deluxe",
            P: "Premium",
            R: "Recliner",
            C: "Couple",
          };

          seatTiers.push({
            tierName: tierNames[code] || code,
            price: Number(tierPrice),
            rows: rows,
            seatsPerRow: screenData.layout.seatsPerRow,
          });
        }
      }

      return {
        name: screenData.name || `Screen ${index + 1}`, // Add name field for Screen model
        screenNumber: screenData.name || `Screen ${index + 1}`,
        theatre: savedTheatre._id,
        seatLayout: {
          layout: screenData.layout.layout || [], // Add the 2D layout array
          rows: screenData.layout.rows,
          seatsPerRow: screenData.layout.seatsPerRow,
          totalSeats: screenData.layout.totalSeats,
        },
        seatTiers: seatTiers,
        isActive: true,
      };
    });

    // Validate screen documents before insertion
    for (let i = 0; i < screenDocs.length; i++) {
      const screenDoc = screenDocs[i];
      if (!screenDoc.seatLayout.layout || screenDoc.seatLayout.layout.length === 0) {
        throw new Error(`Screen ${i + 1} has invalid seat layout`);
      }
      if (!screenDoc.seatTiers || screenDoc.seatTiers.length === 0) {
        throw new Error(`Screen ${i + 1} has no seat tiers defined`);
      }
    }

    if (screenDocs.length > 0) {
      try {
        console.log("Attempting to insert screen documents:", screenDocs.map(doc => ({
          name: doc.name,
          theatre: doc.theatre,
          layoutRows: doc.seatLayout.rows,
          layoutCols: doc.seatLayout.seatsPerRow,
          totalSeats: doc.seatLayout.totalSeats,
          tierCount: doc.seatTiers.length
        })));
        
        const insertedScreens = await Screen.insertMany(screenDocs);
        console.log("Successfully inserted screens:", insertedScreens.length);
      } catch (screenError) {
        console.error("Error inserting screens:", screenError);
        // Clean up created user and theatre if screen insertion fails
        await User.findByIdAndDelete(savedManager._id);
        await Theatre.findByIdAndDelete(savedTheatre._id);
        
        return res.status(500).json({
          success: false,
          message: "Error creating screen configurations",
          error: screenError.message,
        });
      }
    }

    // Delete all OTPs for this email after successful registration
    await Otp.deleteMany({ email: normalizedEmail, purpose: "theatre-registration" });

    // Send notification email to admin about new theatre registration
    try {
      const subject = "New Theatre Registration Request";
      const body = `
        <p>A new theatre registration request has been submitted.</p>
        <p><strong>Theatre Name:</strong> ${theatreName}</p>
        <p><strong>Location:</strong> ${location}</p>
        <p><strong>Manager Name:</strong> ${name}</p>
        <p><strong>Manager Email:</strong> ${normalizedEmail}</p>
        <p>Please log in to the admin panel to review and approve this request.</p>
      `;
      
      // Send to admin email (you may want to configure this)
      await sendEmail({
        to: process.env.ADMIN_EMAIL || "admin@example.com",
        subject,
        body,
      });
    } catch (emailError) {
      console.error("Error sending admin notification email:", emailError);
      // Continue even if admin email fails
    }

    res.status(201).json({
      success: true,
      message: "Theatre registration submitted successfully. Please wait for admin approval.",
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
    
    // Handle specific error cases
    if (error.code === 11000) {
      // MongoDB duplicate key error
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `${field} already exists`,
        error: error.message,
      });
    }
    
    if (error.name === 'ValidationError') {
      // Mongoose validation error
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors,
      });
    }
    
    // Handle custom errors from our validation
    if (error.message.includes('Screen') && error.message.includes('missing required fields')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    
    if (error.message.includes('invalid seat layout')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    
    // Generic error with user-friendly message
    res.status(500).json({
      success: false,
      message: "Unable to complete theatre registration right now. Please try again in a few minutes.",
      hint: "Please check all required fields and try again. If the problem persists, contact support."
    });
  }
};

// Fetch all theatres
export const fetchAllTheatres = async (req, res) => {
  try {
    const theatres = await Theatre.find({ disabled: { $ne: true } }).populate("manager_id", "name email phone");
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
    const { name, location, contact_no, screens } = req.body;

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
