/**
 * Booking Controller
 * Business logic delegated to bookingService
 */

import bookingService from "../services/bookingService.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import Stripe from "stripe";
import { markSeatsAndCompleteBooking } from "./stripeWebhooks.js";

/**
 * Create a new booking
 */
export const createBooking = asyncHandler(async (req, res) => {
  const { showId, selectedSeats } = req.body;
  const userId = req.user.id;

  const booking = await bookingService.createBooking(userId, showId, selectedSeats);

  res.status(201).json({
    success: true,
    message: "Booking created successfully",
    booking,
  });
});

/**
 * Confirm booking after payment
 */
export const confirmStripePayment = asyncHandler(async (req, res) => {
  const { sessionId } = req.body;

  const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
  const session = await stripeInstance.checkout.sessions.retrieve(sessionId);

  const bookingId = session.metadata?.bookingId;
  if (!bookingId) {
    return res.status(400).json({
      success: false,
      message: "Invalid session - missing booking reference",
    });
  }

  await markSeatsAndCompleteBooking(stripeInstance, bookingId, session);

  res.json({ success: true, message: "Payment confirmed" });
});

/**
 * Get booking details
 */
export const getBookingDetails = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;

  const booking = await bookingService.getBookingDetails(bookingId);

  res.json({
    success: true,
    booking,
  });
});

/**
 * Cancel a booking
 */
export const cancelBooking = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const { reason } = req.body;

  const result = await bookingService.cancelBooking(bookingId, reason);

  res.json({
    success: true,
    message: "Booking cancelled successfully",
    ...result,
  });
});

/**
 * Check seats availability
 */
export const checkSeatsAvailability = asyncHandler(async (req, res) => {
  const { showId, selectedSeats } = req.body;

  const availability = await bookingService.checkSeatsAvailability(
    showId,
    selectedSeats
  );

  res.json({
    success: availability.available,
    available: availability.available,
    unavailableSeats: availability.unavailableSeats,
  });
});

/**
 * Calculate seat pricing
 */
export const calculatePricing = asyncHandler(async (req, res) => {
  const { showId, selectedSeats } = req.body;

  const Show = require("../models/show_tbls.js").default;
  const show = await Show.findById(showId);
  if (!show) {
    return res.status(404).json({
      success: false,
      message: "Show not found",
    });
  }

  const pricing = bookingService.calculateSeatPricing(show, selectedSeats);

  res.json({
    success: true,
    pricing,
  });
});

export default {
  createBooking,
  confirmStripePayment,
  getBookingDetails,
  cancelBooking,
  checkSeatsAvailability,
  calculatePricing,
};
