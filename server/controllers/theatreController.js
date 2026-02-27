import TheaterNew from "../models/Theater_new.js";
import UserNew from "../models/User_new.js";
import Otp from "../models/Otp.js";
import ScreenNew from "../models/Screen_new.js";
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
    const existingUser = await UserNew.findOne({ email: normalizedEmail });
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
    const responseBody = { success: true, message: "OTP sent to your email" };
    if (process.env.NODE_ENV !== "production") {
      responseBody.devOtp = otp;
    }
    res.json(responseBody);
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
    const normalizedPhone = (phone || "").replace(/\D/g, "");
    if (!normalizedPhone || normalizedPhone.length !== 10) {
      return res.status(400).json({
        success: false,
        message: "Phone number must be exactly 10 digits",
      });
    }

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
    const existingManager = await UserNew.findOne({ email: normalizedEmail });
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
    const normalizedContactNo = (contact_no || "").replace(/\D/g, "");
    if (normalizedContactNo && normalizedContactNo.length !== 10) {
      return res.status(400).json({
        success: false,
        message: "Contact number must be exactly 10 digits",
      });
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create new manager user (approval is handled via TheaterNew.approval_status)
    const newManager = new UserNew({
      name,
      email: normalizedEmail,
      phone: normalizedPhone,
      password_hash: hashedPassword,
      role: "manager",
    });

    const savedManager = await newManager.save();

    // Create theatre with pending approval status (using new schema with manager_id)
    const newTheatre = new TheaterNew({
      name: theatreName,
      location,
      contact_no: normalizedContactNo,
      email: theatreEmail?.toLowerCase(),
      address,
      city,
      state,
      zipCode,
      step3_pdf_url: theatre.step3_pdf_url,
      manager_id: savedManager._id,
      approval_status: "pending",
    });

    const savedTheatre = await newTheatre.save();
    console.log("[DEBUG] Theatre saved:", savedTheatre._id);
    console.log("[DEBUG] Theatre manager_id:", savedTheatre.manager_id);
    console.log("[DEBUG] Manager ID type:", typeof savedManager._id, savedManager._id);

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
        name: screenData.name || `Screen ${index + 1}`,
        screenNumber: screenData.name || `Screen ${index + 1}`,
        Tid: savedTheatre._id,
        capacity: screenData.layout.totalSeats || 100,
        seatLayout: {
          layout: screenData.layout.layout || [],
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
      if (!screenDoc.seatLayout?.layout || screenDoc.seatLayout.layout.length === 0) {
        throw new Error(`Screen ${i + 1} has invalid seat layout`);
      }
      if (!screenDoc.seatTiers || screenDoc.seatTiers.length === 0) {
        throw new Error(`Screen ${i + 1} has no seat tiers configured`);
      }
    }

    // Insert Screen documents
    try {
      console.log("[DEBUG] Attempting to insert screens:", JSON.stringify(screenDocs, null, 2));
      const insertedScreens = await ScreenNew.insertMany(screenDocs);
      console.log("Successfully inserted screens:", insertedScreens.length);
    } catch (screenError) {
      console.error("[DEBUG] Error inserting screens:", screenError);
      console.error("[DEBUG] Error name:", screenError.name);
      console.error("[DEBUG] Error message:", screenError.message);
      if (screenError.errors) {
        console.error("[DEBUG] Validation errors:", JSON.stringify(screenError.errors, null, 2));
      }
      // Clean up created user and theatre if screen insertion fails
      await UserNew.findByIdAndDelete(savedManager._id);
      await TheaterNew.findByIdAndDelete(savedTheatre._id);

      return res.status(500).json({
        success: false,
        message: "Error creating screen configurations",
        error: screenError.message,
        details: screenError.errors || null,
      });
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
    const { status, disabled } = req.query;

    const filter = {};
    if (status) filter.approval_status = status;
    if (disabled !== undefined) filter.disabled = disabled === "true";

    const theatres = await TheaterNew.find(filter).populate("manager_id", "name email phone");
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

// Search theatres by name or address
export const searchTheatres = async (req, res) => {
  try {
    console.log('Search theatres called with query:', req.query);
    const { q } = req.query;
    
    if (!q || !q.trim()) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const searchRegex = new RegExp(q.trim(), 'i'); // Case-insensitive search
    
    const theatres = await TheaterNew.find({
      disabled: { $ne: true },
      approval_status: 'approved',
      $or: [
        { name: searchRegex },
        { location: searchRegex }
      ]
    }).populate("manager_id", "name email phone").limit(10);

    res.status(200).json({
      success: true,
      theatres,
    });
  } catch (error) {
    console.error("Error searching theatres:", error);
    res.status(500).json({
      success: false,
      message: "Error searching theatres",
      error: error.message,
    });
  }
};

// Fetch theatre by ID (public: only approved, non-disabled theatres)
export const fetchTheatre = async (req, res) => {
  try {
    console.log('Fetch theatre called with params:', req.params);
    const { id } = req.params;
    
    // Skip if this is actually a search request (route conflict)
    if (id === 'search') {
      return res.status(404).json({
        success: false,
        message: "Theatre not found",
      });
    }
    const theatre = await TheaterNew.findById(id).populate("manager_id", "name email phone");

    if (!theatre || theatre.approval_status !== "approved" || theatre.disabled) {
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
    const { name, location, contact_no } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (location) updateData.location = location;
    if (contact_no) updateData.contact_no = contact_no;

    const theatre = await TheaterNew.findByIdAndUpdate(id, updateData, { new: true }).populate(
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

// Delete theatre
export const deleteTheatre = async (req, res) => {
  try {
    const { id } = req.params;
    
    // First find the theatre to get its manager_id
    const theatre = await TheaterNew.findById(id);
    if (!theatre) {
      return res.status(404).json({
        success: false,
        message: "Theatre not found",
      });
    }

    // Delete associated screens from ScreenNew
    await ScreenNew.deleteMany({ Tid: id });

    // Update manager to remove role if needed
    if (theatre.manager_id) {
      await UserNew.findByIdAndUpdate(theatre.manager_id, {
        role: "customer"
      });
    }

    // Finally delete the theatre
    await TheaterNew.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Theatre and associated screens deleted successfully",
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

// Fetch theatres by manager
export const getTheatresByManager = async (req, res) => {
  try {
    const { managerId } = req.params;
    const theatres = await TheaterNew.find({ manager_id: managerId });
    
    res.status(200).json({
      success: true,
      theatres,
    });
  } catch (error) {
    console.error("Error fetching theatres by manager:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching theatres",
      error: error.message,
    });
  }
};

// Fetch screens by theatre
export const fetchScreensByTheatre = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Use ScreenNew to get screens data - only for approved, non-disabled theatres
    const theatre = await TheaterNew.findById(id);
    
    if (!theatre || theatre.approval_status !== "approved" || theatre.disabled) {
      return res.json({ success: false, message: "Theatre not found" });
    }
    
    // Fetch screens from ScreenNew
    const screens = await ScreenNew.find({ Tid: id })
      .populate("theatre", "name location")
      .sort({ name: 1 });
    
    res.json({ success: true, screens });
  } catch (error) {
    console.error("[fetchScreensByTheatre]", error);
    res.json({ success: false, message: error.message });
  }
};
