import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: [true, "User ID is required"]
  },
  show_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Show", 
    required: [true, "Show ID is required"]
  },
  seats_booked: [{ 
    seatNumber: {
      type: String,
      required: true
    },
    tierName: String,
    price: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  total_amount: { 
    type: Number, 
    required: [true, "Total amount is required"],
    min: [0, "Total amount cannot be negative"]
  },
  status: { 
    type: String, 
    required: true, 
    enum: {
      values: ["pending", "confirmed", "cancelled"],
      message: "Status must be pending, confirmed, or cancelled"
    },
    default: "pending"
  },
  cancellation_reason: {
    type: String,
    default: null
  },
  cancelled_at: {
    type: Date,
    default: null
  },
  payment_status: {
    type: String,
    enum: {
      values: ["pending", "completed", "failed", "refunded"],
      message: "Payment status must be pending, completed, failed, or refunded"
    },
    default: "pending"
  },
  payment_id: {
    type: String,
    trim: true,
    default: null
  },
  payment_link: { 
    type: String, 
    trim: true,
    default: null
  },
  payment_method: {
    type: String,
    enum: {
      values: ["stripe", "manual", null],
      message: "Payment method must be stripe or manual"
    },
    default: null
  },
  // For refunds
  refund_amount: {
    type: Number,
    default: 0
  },
  refunded_at: {
    type: Date,
    default: null
  },
  isDeleted: {
    type: Boolean,
    default: false,
    select: false
  }
}, { timestamps: true });

// Indexes for faster queries
bookingSchema.index({ user_id: 1, createdAt: -1 });
bookingSchema.index({ show_id: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ payment_status: 1 });
bookingSchema.index({ isDeleted: 1 });

// Query middleware to exclude deleted bookings by default
bookingSchema.pre(/^find/, function() {
  if (this.getOptions()?.includeDeleted !== true) {
    this.where({ isDeleted: { $ne: true } });
  }
});

const Booking = mongoose.model("Booking", bookingSchema, "bookings_new");

export default Booking;
