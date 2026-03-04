/**
 * Theatre service
 * Handles theatre registration, approval, and management
 */

import Theatre from "../models/Theatre.js";
import User from "../models/User.js";
import Otp from "../models/Otp.js";
import sendEmail from "../configs/nodeMailer.js";
import bcrypt from "bcryptjs";
import {
  validatePassword,
  validateEmail,
  validatePhone,
  validateName,
  sanitizeEmail,
} from "./validationService.js";
import {
  ValidationError,
  NotFoundError,
  AlreadyExistsError,
  UnauthorizedError,
} from "./errorService.js";

const THEATRE_OTP_TTL_MS = 2 * 60 * 1000; // 2 minutes
const BCRYPT_ROUNDS = 10;

/**
 * Verify OTP for theatre registration (step before final registration)
 */
export const verifyTheatreOtp = async (email, otp) => {
  // Validate email
  const emailValidation = validateEmail(email);
  if (!emailValidation.valid) {
    throw new ValidationError(emailValidation.message);
  }

  // Validate OTP format
  if (!otp || otp.length !== 6) {
    throw new ValidationError("Invalid OTP format");
  }

  const normalizedEmail = sanitizeEmail(email);

  // Find OTP record
  const otpRecord = await Otp.findOne({
    email: normalizedEmail,
    purpose: "theatre-registration",
  });

  if (!otpRecord) {
    throw new ValidationError("OTP not found or expired");
  }

  if (new Date() > otpRecord.expiresAt) {
    await Otp.deleteOne({ _id: otpRecord._id });
    throw new ValidationError("OTP has expired");
  }

  const isValidOtp = await bcrypt.compare(otp, otpRecord.otpHash);
  if (!isValidOtp) {
    throw new ValidationError("Invalid OTP");
  }

  // OTP is valid - don't delete it yet, just mark as verified for registration
  return {
    success: true,
    message: "OTP verified successfully",
    email: normalizedEmail,
    verified: true,
  };
};

/**
 * Request OTP for theatre registration
 */
export const requestTheatreOtp = async (email) => {
  // Validate email
  const emailValidation = validateEmail(email);
  if (!emailValidation.valid) {
    throw new ValidationError(emailValidation.message);
  }

  const normalizedEmail = sanitizeEmail(email);

  // Check if email already exists
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new AlreadyExistsError("Email");
  }

  // Delete any existing OTPs
  await Otp.deleteMany({
    email: normalizedEmail,
    purpose: "theatre-registration",
  });

  // Generate OTP
  const otp = ("000000" + Math.floor(Math.random() * 999999)).slice(-6);
  const otpHash = await bcrypt.hash(otp, BCRYPT_ROUNDS);
  const expiresAt = new Date(Date.now() + THEATRE_OTP_TTL_MS);

  await Otp.create({
    email: normalizedEmail,
    otpHash,
    purpose: "theatre-registration",
    expiresAt,
  });

  // Log OTP in development
  if (process.env.NODE_ENV !== "production") {
    console.log(
      `[DEV] Theatre registration OTP for ${normalizedEmail}: ${otp}`
    );
  }

  // Send email
  try {
    await sendEmail({
      to: normalizedEmail,
      subject: "Theatre Registration OTP",
      body: `<p>Your theatre registration OTP is <strong>${otp}</strong>. It expires in 2 minutes.</p>`,
    });
  } catch (err) {
    console.error("[requestTheatreOtp] Email send failed:", err);
    if (process.env.NODE_ENV === "production") {
      throw err;
    }
  }

  const response = { success: true, message: "OTP sent to your email" };
  if (process.env.NODE_ENV !== "production") {
    response.devOtp = otp;
  }
  return response;
};

/**
 * Register a new theatre with manager
 */
export const registerTheatre = async (registrationData) => {
  const { manager, theatre, screens, otp } = registrationData;

  // Validate OTP format
  if (!otp || otp.length !== 6) {
    throw new ValidationError("Invalid OTP format");
  }

  // Validate manager data
  if (!manager || !manager.name || !manager.email || !manager.phone || !manager.password) {
    throw new ValidationError("Manager details are incomplete");
  }

  // Validate manager fields
  const nameValidation = validateName(manager.name);
  if (!nameValidation.valid) throw new ValidationError(nameValidation.message);

  const emailValidation = validateEmail(manager.email);
  if (!emailValidation.valid) throw new ValidationError(emailValidation.message);

  const phoneValidation = validatePhone(manager.phone);
  if (!phoneValidation.valid) throw new ValidationError(phoneValidation.message);

  const passwordValidation = validatePassword(manager.password);
  if (!passwordValidation.valid) throw new ValidationError(passwordValidation.message);

  // Validate theatre data
  if (!theatre || !theatre.name || !theatre.location) {
    throw new ValidationError("Theatre name and location are required");
  }

  // Validate screens
  if (!Array.isArray(screens) || screens.length === 0) {
    throw new ValidationError("At least one screen is required");
  }

  const normalizedEmail = sanitizeEmail(manager.email);

  // Verify OTP
  const otpRecord = await Otp.findOne({
    email: normalizedEmail,
    purpose: "theatre-registration",
  });

  if (!otpRecord) {
    throw new ValidationError("OTP not found or expired");
  }

  if (new Date() > otpRecord.expiresAt) {
    await Otp.deleteOne({ _id: otpRecord._id });
    throw new ValidationError("OTP has expired");
  }

  const isValidOtp = await bcrypt.compare(otp, otpRecord.otpHash);
  if (!isValidOtp) {
    throw new ValidationError("Invalid OTP");
  }

  // Check if email already registered (shouldn't happen, but double-check)
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new AlreadyExistsError("Email");
  }

  // Create manager user
  const password_hash = await bcrypt.hash(manager.password, BCRYPT_ROUNDS);
  const managerUser = await User.create({
    name: manager.name,
    email: normalizedEmail,
    phone: manager.phone,
    password_hash,
    role: "manager",
    last_login: new Date(),
  });

  // Create theatre
  const theatreDoc = await Theatre.create({
    name: theatre.name,
    location: theatre.location,
    manager_id: managerUser._id,
    contact_no: theatre.contact_no,
    email: theatre.email,
    address: theatre.address,
    city: theatre.city,
    state: theatre.state,
    zipCode: theatre.zipCode,
    step3_pdf_url: theatre.step3_pdf_url,
    approval_status: "pending",
  });

  // Link theatre to manager
  managerUser.managedTheatreId = theatreDoc._id;
  await managerUser.save();

  // Delete OTP
  await Otp.deleteOne({ _id: otpRecord._id });

  return {
    success: true,
    message: "Theatre registration submitted for approval",
    theatreId: theatreDoc._id.toString(),
    managerId: managerUser._id.toString(),
  };
};

/**
 * Get theatre details
 */
export const getTheatreDetails = async (theatreId) => {
  const theatre = await Theatre.findById(theatreId).populate(
    "manager_id",
    "name email phone"
  );

  if (!theatre) {
    throw new NotFoundError("Theatre");
  }

  return {
    id: theatre._id.toString(),
    name: theatre.name,
    location: theatre.location,
    manager: {
      id: theatre.manager_id._id.toString(),
      name: theatre.manager_id.name,
      email: theatre.manager_id.email,
      phone: theatre.manager_id.phone,
    },
    contact: theatre.contact_no,
    email: theatre.email,
    address: theatre.address,
    city: theatre.city,
    state: theatre.state,
    zipCode: theatre.zipCode,
    approvalStatus: theatre.approval_status,
    approvalDate: theatre.approval_date,
    disabled: theatre.disabled,
    createdAt: theatre.createdAt,
  };
};

/**
 * Get all theatres
 */
export const getAllTheatres = async (filters = {}, skip = 0, limit = 50) => {
  const query = { approval_status: "approved", disabled: false };

  if (filters.city) {
    query.city = filters.city;
  }

  const theatres = await Theatre.find(query)
    .populate("manager_id", "name email")
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await Theatre.countDocuments(query);

  return {
    theatres: theatres.map((t) => ({
      id: t._id.toString(),
      name: t.name,
      location: t.location,
      city: t.city,
      state: t.state,
      contact: t.contact_no,
    })),
    pagination: {
      total,
      skip,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get pending theatres (admin only)
 */
export const getPendingTheatres = async (skip = 0, limit = 50) => {
  const theatres = await Theatre.find({ approval_status: "pending" })
    .populate("manager_id", "name email phone")
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await Theatre.countDocuments({ approval_status: "pending" });

  return {
    theatres: theatres.map((t) => ({
      id: t._id.toString(),
      name: t.name,
      location: t.location,
      manager: {
        id: t.manager_id._id.toString(),
        name: t.manager_id.name,
        email: t.manager_id.email,
        phone: t.manager_id.phone,
      },
      approvalStatus: t.approval_status,
      createdAt: t.createdAt,
    })),
    pagination: {
      total,
      skip,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Approve or decline theatre (admin only)
 */
export const approveTheatre = async (theatreId, action, notes = "") => {
  if (!["approve", "decline"].includes(action)) {
    throw new ValidationError("Invalid action. Must be approve or decline");
  }

  const theatre = await Theatre.findById(theatreId).populate(
    "manager_id",
    "name email"
  );
  if (!theatre) {
    throw new NotFoundError("Theatre");
  }

  if (theatre.approval_status !== "pending") {
    throw new ValidationError("Theatre has already been processed");
  }

  if (action === "approve") {
    theatre.approval_status = "approved";
    theatre.approval_date = new Date();
    theatre.approval_notes = notes;
    await theatre.save();

    // Send approval email
    try {
      await sendEmail({
        to: theatre.manager_id.email,
        subject: "Theatre Registration Approved",
        body: `
          <h2>Congratulations! Your Theatre Registration is Approved</h2>
          <p>Dear ${theatre.manager_id.name},</p>
          <p>Your theatre <strong>${theatre.name}</strong> has been approved.</p>
          <p>You can now log in to your management dashboard.</p>
        `,
      });
    } catch (err) {
      console.error("[approveTheatre] Email send failed:", err);
    }
  } else {
    theatre.approval_status = "declined";
    theatre.approval_notes = notes;
    await theatre.save();

    // Send decline email
    try {
      await sendEmail({
        to: theatre.manager_id.email,
        subject: "Theatre Registration Update",
        body: `
          <h2>Theatre Registration Status Update</h2>
          <p>Dear ${theatre.manager_id.name},</p>
          <p>Your theatre registration for <strong>${theatre.name}</strong> has been declined.</p>
          ${notes ? `<p>Reason: ${notes}</p>` : ""}
          <p>Please contact support if you have questions.</p>
        `,
      });
    } catch (err) {
      console.error("[approveTheatre] Email send failed:", err);
    }
  }

  return {
    success: true,
    message: `Theatre ${action}ed successfully`,
    theatreId: theatre._id.toString(),
    status: theatre.approval_status,
  };
};

export default {
  requestTheatreOtp,
  verifyTheatreOtp,
  registerTheatre,
  getTheatreDetails,
  getAllTheatres,
  getPendingTheatres,
  approveTheatre,
};
