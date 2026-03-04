import mongoose from "mongoose";

/**
 * PAYMENT_TBL — matches schema diagram exactly.
 * Linked to bookings_new via booking_id FK.
 * Stripe-specific fields (session_id, receipt_url) added for production use.
 */
const paymentSchema = new mongoose.Schema(
  {
    booking_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",                     // FK → bookings_new
      required: [true, "Booking ID is required"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    method: {
      type: String,
      required: [true, "Payment method is required"],
      enum: {
        values: ["UPI", "card", "netbanking", "wallet", "stripe"],
        message: "Method must be UPI, card, netbanking, wallet or stripe",
      },
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ["success", "failed", "refunded", "pending"],
        message: "Status must be success, failed, refunded or pending",
      },
      default: "pending",
    },
    transaction_id: {
      type: String,
      required: [true, "Transaction ID is required"],
      unique: true,
      trim: true,
    },
    payment_time: {
      type: Date,
      required: true,
      default: Date.now,
    },
    // Stripe-specific fields
    stripe_session_id: {
      type: String,
      trim: true,
      default: null,
    },
    stripe_payment_intent: {
      type: String,
      trim: true,
      default: null,
    },
    receipt_url: {
      type: String,
      trim: true,
      default: null,
    },
    failure_reason: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

paymentSchema.index({ booking_id: 1 });
paymentSchema.index({ status: 1 });

const Payment = mongoose.model("Payment", paymentSchema, "payments");

export default Payment;
