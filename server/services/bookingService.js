/**
 * Booking service
 * Handles seat availability, booking creation, and payment
 */

import Booking from "../models/Booking.js";
import Show from "../models/show_tbls.js";
import User from "../models/User.js";
import Movie from "../models/Movie.js";
import { NotFoundError, ValidationError } from "./errorService.js";

const INR_TO_USD_RATE = Number(process.env.INR_TO_USD_RATE || 0.011);

/**
 * Convert INR to USD
 */
export const convertInrToUsd = (amountInInr) => {
  return Math.round(amountInInr * INR_TO_USD_RATE * 100) / 100;
};

/**
 * Normalize seat numbers from various formats
 */
const normalizeSeatData = (selectedSeats) => {
  if (!Array.isArray(selectedSeats) || selectedSeats.length === 0) {
    return [];
  }

  return selectedSeats
    .map((seat) => {
      if (!seat) return null;

      // If it's just a string, create seat object
      if (typeof seat === "string") {
        return {
          seatNumber: seat.trim().toUpperCase(),
        };
      }

      // If it's an object, extract seatNumber
      if (typeof seat === "object" && seat.seatNumber) {
        return {
          seatNumber: String(seat.seatNumber).trim().toUpperCase(),
          tierName: seat.tierName,
          price: seat.price,
        };
      }

      return null;
    })
    .filter(Boolean);
};

/**
 * Check if selected seats are available
 */
export const checkSeatsAvailability = async (showId, selectedSeats) => {
  const show = await Show.findById(showId);
  if (!show) {
    throw new NotFoundError("Show");
  }

  const normalizedSeats = normalizeSeatData(selectedSeats);
  if (normalizedSeats.length === 0) {
    throw new ValidationError("No valid seats selected");
  }

  // Check each seat against all tiers
  const unavailableSeats = [];
  for (const seat of normalizedSeats) {
    const seatNumber = seat.seatNumber;
    let isAvailable = false;

    // Check if seat exists in any tier and is not occupied
    if (show.seatTiers && Array.isArray(show.seatTiers)) {
      for (const tier of show.seatTiers) {
        if (
          tier.occupiedSeats &&
          typeof tier.occupiedSeats === "object" &&
          !tier.occupiedSeats[seatNumber]
        ) {
          isAvailable = true;
          break;
        }
      }
    } else {
      isAvailable = true; // If no tiers defined, assume available
    }

    if (!isAvailable) {
      unavailableSeats.push(seatNumber);
    }
  }

  return {
    available: unavailableSeats.length === 0,
    unavailableSeats,
  };
};

/**
 * Get seat pricing for selected seats
 */
export const calculateSeatPricing = (show, selectedSeats) => {
  const normalizedSeats = normalizeSeatData(selectedSeats);

  let totalPrice = 0;
  const pricedSeats = [];

  for (const seat of normalizedSeats) {
    let seatPrice = show.basePrice || 150;

    // Try to find tier price
    if (show.seatTiers && Array.isArray(show.seatTiers)) {
      const tierName = seat.tierName || "Standard";
      const tier = show.seatTiers.find((t) => t.tierName === tierName);
      if (tier && tier.price) {
        seatPrice = tier.price;
      }
    }

    totalPrice += seatPrice;
    pricedSeats.push({
      seatNumber: seat.seatNumber,
      tierName: seat.tierName || "Standard",
      price: seatPrice,
    });
  }

  return {
    seatsBooked: pricedSeats,
    totalPriceINR: totalPrice,
    totalPriceUSD: convertInrToUsd(totalPrice),
  };
};

/**
 * Create a new booking
 */
export const createBooking = async (userId, showId, selectedSeats) => {
  // Validate inputs
  if (!userId || !showId || !selectedSeats || selectedSeats.length === 0) {
    throw new ValidationError("User ID, Show ID, and seats are required");
  }

  // Verify user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError("User");
  }

  // Verify show exists
  const show = await Show.findById(showId);
  if (!show) {
    throw new NotFoundError("Show");
  }

  // Check if show is cancelled
  if (show.status === "cancelled" || !show.isActive) {
    throw new ValidationError("This show is no longer available");
  }

  // Check if show is in the past
  if (new Date() > show.showDateTime) {
    throw new ValidationError("Cannot book for past shows");
  }

  // Check seat availability
  const availability = await checkSeatsAvailability(showId, selectedSeats);
  if (!availability.available) {
    throw new ValidationError(
      `Seats ${availability.unavailableSeats.join(", ")} are not available`
    );
  }

  // Calculate pricing
  const pricing = calculateSeatPricing(show, selectedSeats);

  // Create booking
  const booking = await Booking.create({
    user_id: userId,
    show_id: showId,
    seats_booked: pricing.seatsBooked,
    total_amount: pricing.totalPriceINR,
    status: "pending",
    payment_status: "pending",
  });

  return {
    bookingId: booking._id.toString(),
    userId: booking.user_id.toString(),
    showId: booking.show_id.toString(),
    seats: booking.seats_booked,
    totalAmount: booking.total_amount,
    totalAmountUSD: pricing.totalPriceUSD,
    status: booking.status,
    paymentStatus: booking.payment_status,
    createdAt: booking.createdAt,
  };
};

/**
 * Mark seats as occupied after payment
 */
export const markSeatsOccupied = async (showId, seatsBooked) => {
  const show = await Show.findById(showId);
  if (!show) {
    throw new NotFoundError("Show");
  }

  // Mark each seat as occupied in its tier
  for (const seat of seatsBooked) {
    const seatNumber = seat.seatNumber;

    if (show.seatTiers && Array.isArray(show.seatTiers)) {
      for (const tier of show.seatTiers) {
        if (!tier.occupiedSeats) {
          tier.occupiedSeats = {};
        }
        // Mark seat as occupied with timestamp and tier info
        tier.occupiedSeats[seatNumber] = {
          bookedAt: new Date(),
          tierName: seat.tierName,
        };
      }
    }
  }

  // Update show status if all seats are booked
  const totalOccupied = Object.keys(show.seatTiers[0]?.occupiedSeats || {})
    .length;
  if (totalOccupied >= (show.totalCapacity || 0)) {
    show.status = "full";
  }

  await show.save();
};

/**
 * Confirm booking after payment
 */
export const confirmBooking = async (bookingId, paymentId, paymentMethod) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new NotFoundError("Booking");
  }

  // Update booking with payment info
  booking.status = "confirmed";
  booking.payment_status = "completed";
  booking.payment_id = paymentId;
  booking.payment_method = paymentMethod || "stripe";
  await booking.save();

  // Mark seats as occupied
  await markSeatsOccupied(booking.show_id, booking.seats_booked);

  return {
    bookingId: booking._id.toString(),
    status: booking.status,
    paymentStatus: booking.payment_status,
    confirmedAt: booking.updatedAt,
  };
};

/**
 * Cancel a booking
 */
export const cancelBooking = async (bookingId, reason = "User requested") => {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new NotFoundError("Booking");
  }

  if (booking.status === "cancelled") {
    throw new ValidationError("Booking is already cancelled");
  }

  if (booking.status === "confirmed" && booking.payment_status === "completed") {
    // Mark for refund
    booking.status = "cancelled";
    booking.payment_status = "refunded";
    booking.cancellation_reason = reason;
    booking.cancelled_at = new Date();
    // TODO: Process actual refund
  } else {
    booking.status = "cancelled";
    booking.cancellation_reason = reason;
    booking.cancelled_at = new Date();
  }

  await booking.save();

  return {
    bookingId: booking._id.toString(),
    status: booking.status,
    paymentStatus: booking.payment_status,
    cancellationReason: reason,
  };
};

/**
 * Get booking details
 */
export const getBookingDetails = async (bookingId) => {
  const booking = await Booking.findById(bookingId)
    .populate({
      path: "show_id",
      populate: [
        { path: "movie", select: "title poster_path" },
        { path: "theatre", select: "name city" },
        { path: "screen", select: "name" },
      ],
    })
    .populate("user_id", "name email phone");

  if (!booking) {
    throw new NotFoundError("Booking");
  }

  return {
    bookingId: booking._id.toString(),
    user: {
      id: booking.user_id._id.toString(),
      name: booking.user_id.name,
      email: booking.user_id.email,
      phone: booking.user_id.phone,
    },
    show: {
      id: booking.show_id._id.toString(),
      movie: booking.show_id.movie,
      theatre: booking.show_id.theatre,
      screen: booking.show_id.screen,
      dateTime: booking.show_id.showDateTime,
    },
    seats: booking.seats_booked,
    totalAmount: booking.total_amount,
    status: booking.status,
    paymentStatus: booking.payment_status,
    paymentId: booking.payment_id,
    createdAt: booking.createdAt,
  };
};

export default {
  checkSeatsAvailability,
  calculateSeatPricing,
  createBooking,
  markSeatsOccupied,
  confirmBooking,
  cancelBooking,
  getBookingDetails,
  convertInrToUsd,
};
