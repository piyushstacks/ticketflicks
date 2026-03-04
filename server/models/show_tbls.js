import mongoose from "mongoose";

const showSchema = new mongoose.Schema({
  movie: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Movie",
    required: [true, "Movie is required"]
  },
  theatre: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Theatre",
    required: [true, "Theatre is required"]
  },
  screen: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ScreenTbl",
    required: [true, "Screen is required"]
  },
  showDateTime: {
    type: Date,
    required: [true, "Show date and time is required"]
  },
  language: {
    type: String,
    trim: true,
    default: "English"
  },
  // Base price (can be overridden by tier prices)
  basePrice: {
    type: Number,
    default: 150,
    min: [0, "Base price cannot be negative"]
  },
  // Seat tier configuration — stored as Mixed to support both seeding formats:
  //   Old format: [{ tierName: "Standard", price: 150, occupiedSeats: {} }]
  //   New format: [{ name: "Silver",       price: 150, color: "#...", occupiedSeats: {} }]
  seatTiers: {
    type: mongoose.Schema.Types.Mixed,
    default: []
  },
  // Overall capacity
  totalCapacity: {
    type: Number,
    min: [0]
  },
  // seats_new stores total seat count directly as 'totalSeats'
  totalSeats: {
    type: Number,
    min: [0]
  },
  // Booked seat records (used by shows_new seed format)
  bookedSeats: {
    type: mongoose.Schema.Types.Mixed,
    default: []
  },
  // Availability status
  status: {
    type: String,
    enum: {
      values: ["available", "full", "cancelled"],
      message: "Status must be available, full, or cancelled"
    },
    default: "available"
  },
  // Cancellation info
  cancellation_reason: {
    type: String,
    default: null
  },
  cancelled_at: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isDeleted: {
    type: Boolean,
    default: false,
    select: false
  }
}, { timestamps: true });

// Indexes for faster queries
showSchema.index({ theatre: 1, showDateTime: 1 });
showSchema.index({ movie: 1, showDateTime: 1 });
showSchema.index({ status: 1 });
showSchema.index({ showDateTime: 1 });
showSchema.index({ isDeleted: 1 });

// Query middleware to exclude deleted shows by default
showSchema.pre(/^find/, function () {
  if (this.getOptions()?.includeDeleted !== true) {
    this.where({ isDeleted: { $ne: true } });
  }
});

const Show = mongoose.model("Show", showSchema, "shows_new");

export default Show;
