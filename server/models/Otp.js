import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    email: { 
      type: String, 
      required: true, 
      index: true,
      lowercase: true,  // Automatically store email in lowercase
      trim: true        // Remove whitespace
    },
    otpHash: { type: String, required: true },
    purpose: { type: String, enum: ["login", "forgot", "theatre-registration"], default: "login" },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

const Otp = mongoose.model("Otp", otpSchema, "otp_tbls");

export default Otp;
