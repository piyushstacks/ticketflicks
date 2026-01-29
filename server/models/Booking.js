import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    user: { type: String, required: true, ref: "User" },
    show: { type: String, required: true, ref: "Show" },
    theatre: { type: mongoose.Schema.Types.ObjectId, ref: "Theatre" },
    screen: { type: mongoose.Schema.Types.ObjectId, ref: "ScreenTbl" },
    bookedSeats: [
      {
        seatNumber: { type: String, required: true }, // e.g., "A1", "B5"
        tierName: { type: String, required: true }, // e.g., "Standard", "Premium", "VIP"
        price: { type: Number, required: true }, // Price for this specific seat
      },
    ],
    amount: { type: Number, required: true }, // Total amount for all seats
    isPaid: { type: Boolean, default: false },
    paymentLink: { type: String },
    paymentIntentId: { type: String }, // Stripe payment intent ID
    paymentMode: { type: String, default: null }, // e.g. "stripe", "card"
    receiptUrl: { type: String, default: null }, // Stripe receipt URL for customer
    cancellationReason: { type: String },
  },
  { timestamps: true }
);

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;
