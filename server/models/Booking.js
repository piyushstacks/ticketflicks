import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  show_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Show", 
    required: true 
  },
  seats_booked: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Seat", 
    required: true 
  }],
  total_amount: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  status: { 
    type: String, 
    required: true, 
    enum: ["confirmed", "cancelled", "pending"],
    default: "pending"
  },
  payment_link: { 
    type: String, 
    trim: true 
  },
  isPaid: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Index for faster queries
bookingSchema.index({ user_id: 1, createdAt: -1 });
bookingSchema.index({ show_id: 1 });

const Booking = mongoose.model("Booking", bookingSchema, "bookings_new");

export default Booking;
