import express from "express";
import {
  createBooking,
  confirmStripePayment,
  fetchOccupiedSeats,
  fetchUserBookings,
  cancelBooking,
  getAllOrManagerBookings,
} from "../controllers/bookingController_old.js";
import { getPaymentByBooking } from "../controllers/bookingController.js";
import { protectUser } from "../middleware/protectUser.js";
import { protectManager } from "../middleware/auth.js";
import Booking from "../models/Booking.js";

const bookingRouter = express.Router();

// Core booking flow
bookingRouter.post("/create", protectUser, createBooking);
bookingRouter.post("/confirm-stripe", protectUser, confirmStripePayment);
bookingRouter.get("/seats/:showId", fetchOccupiedSeats);
bookingRouter.get("/my-bookings", protectUser, fetchUserBookings);
bookingRouter.put("/:bookingId/cancel", protectUser, cancelBooking);

// Manager and Admin: bookings dashboard data
bookingRouter.get("/bookings", protectUser, getAllOrManagerBookings);

// Payment lookup
bookingRouter.get("/:bookingId/payment", protectUser, getPaymentByBooking);

/**
 * GET /api/booking/:bookingId/payment-link
 * Returns the active payment link if within 10-minute window, else null.
 * Backend enforces the expiry rather than relying only on frontend.
 */
bookingRouter.get("/:bookingId/payment-link", protectUser, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findOne({
      _id: bookingId,
      user_id: req.user.id,
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    // Already paid – no link needed
    if (booking.payment_status === "completed") {
      return res.json({ success: true, paymentLink: null, status: "paid" });
    }

    // Expired or cancelled
    if (booking.status === "cancelled") {
      return res.json({ success: true, paymentLink: null, status: "cancelled" });
    }

    const TEN_MINUTES = 10 * 60 * 1000;
    const isWithinWindow =
      Date.now() - new Date(booking.createdAt).getTime() < TEN_MINUTES;

    if (!isWithinWindow) {
      // Expire the booking automatically
      await Booking.findByIdAndUpdate(bookingId, {
        payment_link: null,
        status: "cancelled",
        cancellation_reason: "Payment window expired (10 minutes)",
        cancelled_at: new Date(),
      });
      return res.json({ success: true, paymentLink: null, status: "expired" });
    }

    return res.json({
      success: true,
      paymentLink: booking.payment_link,
      status: "pending",
    });
  } catch (err) {
    console.error("[payment-link]", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default bookingRouter;
