import mongoose from "mongoose";

const theaterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    location: { type: String, required: true },
    address: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String },
    phone: { type: String },
    email: { type: String },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    screens: [{ type: mongoose.Schema.Types.ObjectId, ref: "Screen" }],
    movies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Movie" }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

const Theater = mongoose.model("Theater", theaterSchema, "theater_tbls");

export default Theater;
