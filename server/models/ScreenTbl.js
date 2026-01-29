import mongoose from "mongoose";

const screenTblSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g., "Screen 1", "Screen 2"
    screenNumber: { type: String, required: true }, // e.g., "1", "2", "A", "B"
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
    status: { 
      type: String, 
      enum: ['active', 'inactive', 'maintenance'], 
      default: 'active' 
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Manager who created it
    lastModifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Last manager to modify
  },
  { 
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: 'screen_tbl' // Explicitly set collection name
  }
);

// Add indexes for better query performance
screenTblSchema.index({ theatre: 1, isActive: 1 });
screenTblSchema.index({ theatre: 1, status: 1 });
screenTblSchema.index({ name: 1, theatre: 1 });

const ScreenTbl = mongoose.model("ScreenTbl", screenTblSchema);

export default ScreenTbl;