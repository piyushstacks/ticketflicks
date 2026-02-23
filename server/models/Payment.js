import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  booking_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Booking", 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  method: { 
    type: String, 
    required: true, 
    enum: ["UPI", "card", "netbanking", "wallet"] 
  },
  status: { 
    type: String, 
    required: true, 
    enum: ["success", "failed", "refunded", "pending"],
    default: "pending"
  },
  transaction_id: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true 
  },
  payment_time: { 
    type: Date, 
    required: true,
    default: Date.now
  }
}, { timestamps: true });

// Index for faster queries
paymentSchema.index({ booking_id: 1 });

const Payment = mongoose.model("Payment", paymentSchema, "payments");

export default Payment;
