import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { 
      type: String, 
      required: true, 
      unique: true,
      lowercase: true, // Automatically store email in lowercase
      index: true,     // Index for faster lookups
      trim: true       // Remove whitespace
    },
    phone: { type: String, required: true },
    password_hash: { type: String, required: true },
    role: { type: String, enum: ["customer", "admin", "manager"], default: "customer" },
    managedTheaterId: { type: mongoose.Schema.Types.ObjectId, ref: "Theater" },
    last_login: { type: Date },
    favorites: { type: [String], default: [] },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

// Use model name 'User' for populate() compatibility and save to
// the 'user_tbls' collection as requested.
const User = mongoose.model("User", userSchema, "user_tbls");

export default User;
