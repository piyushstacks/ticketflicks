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
  // Human-readable time string e.g. "14:30"
  showTime: {
    type: String,
    trim: true
  },
  // Date range for recurring daily shows
  startDate: {
    type: String,  // stored as "YYYY-MM-DD"
    trim: true
  },
  endDate: {
    type: String,  // stored as "YYYY-MM-DD"
    trim: true
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
  // Seat tier configuration with prices
  seatTiers: [{
    tierName: {
      type: String,
      required: true,
      enum: ["Standard", "Deluxe", "Premium", "Recliner", "Couple"]
    },
    price: {
      type: Number,
      required: true,
      min: [0, "Tier price cannot be negative"]
    },
    // For future use if tiers have seat counts
    totalSeats: {
      type: Number,
      default: 0
    },
    // Track occupied seats per tier
    occupiedSeats: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  }],
  // Overall capacity
  totalCapacity: {
    type: Number,
    min: [1, "Capacity must be at least 1"]
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
