import mongoose from "mongoose";

const screenSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g., "Screen 1", "Screen 2"
    screenNumber: { type: String, required: true }, // e.g., "Screen 1", "Screen 2"
    theatre: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Theatre" },
    seatLayout: {
      layout: { type: [[String]], required: true }, // 2D array of seat types
      rows: { type: Number, required: true }, // Number of rows
      seatsPerRow: { type: Number, required: true }, // Seats per row
      totalSeats: { type: Number, required: true }, // Total seats in the screen
    },
    seatTiers: [
      {
        tierName: { type: String, required: true }, // e.g., "Standard", "Premium", "VIP"
        price: { type: Number, required: true },
        rows: [String], // e.g., ["A", "B", "C"] or specific rows for this tier
        seatsPerRow: { type: Number }, // Optional: if different from default
      },
    ],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

const Screen = mongoose.model("Screen", screenSchema);

export default Screen;
