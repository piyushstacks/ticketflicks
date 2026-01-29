import { inngest } from "../inngest/index.js";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import Stripe from "stripe";

const INR_TO_USD_RATE = Number(process.env.INR_TO_USD_RATE || 0.011);

const convertInrToUsd = (amountInInr) => {
  return amountInInr * INR_TO_USD_RATE;
};

// Function to check availability of selected seats with seat tier support
const normalizeSelectedSeats = (selectedSeats) => {
  if (!Array.isArray(selectedSeats)) return [];

  return selectedSeats
    .map((s) => {
      if (!s) return null;
      if (typeof s === "string") return { seatNumber: s };
      if (typeof s === "object" && typeof s.seatNumber === "string") {
        return { seatNumber: s.seatNumber };
      }
      return null;
    })
    .filter(Boolean);
};

const SEAT_CODE_MAP = {
  S: { tierName: "Standard", basePrice: 150 },
  D: { tierName: "Deluxe", basePrice: 200 },
  P: { tierName: "Premium", basePrice: 250 },
  R: { tierName: "Recliner", basePrice: 350 },
  C: { tierName: "Couple", basePrice: 500 },
};

const getSeatCodeFromLayout = (seatLayout, seatNumber) => {
  if (!seatLayout?.layout || !Array.isArray(seatLayout.layout)) return null;

  const rowLetter = String(seatNumber || "").charAt(0);
  const colNumberRaw = String(seatNumber || "").slice(1);
  const rowIndex = rowLetter.toUpperCase().charCodeAt(0) - 65;
  const colIndex = Number.parseInt(colNumberRaw, 10) - 1;
  if (!Number.isFinite(rowIndex) || !Number.isFinite(colIndex)) return null;
  if (rowIndex < 0 || colIndex < 0) return null;

  const row = seatLayout.layout[rowIndex];
  if (!Array.isArray(row)) return null;
  if (colIndex >= row.length) return null;

  const code = row[colIndex];
  if (!code) return null;
  return code;
};

const getTierInfoForSeat = (screen, seatNumber) => {
  // Prefer explicit tier configuration by rows (if present)
  if (screen?.seatTiers && Array.isArray(screen.seatTiers) && screen.seatTiers.length > 0) {
    const row = seatNumber.charAt(0);
    for (const tier of screen.seatTiers) {
      const rows = tier.rows || [];
      if (rows.includes(row)) {
        return { tierName: tier.tierName, price: tier.price };
      }
    }
  }

  // Fallback: derive from seatLayout seat code (S/D/P/R/C)
  const seatCode = getSeatCodeFromLayout(screen?.seatLayout, seatNumber);
  const mapped = SEAT_CODE_MAP[seatCode];
  if (!mapped) return null;

  // If screen has tier prices configured with same names, prefer those prices
  if (screen?.seatTiers && Array.isArray(screen.seatTiers) && screen.seatTiers.length > 0) {
    const exactTier = screen.seatTiers.find((t) => t.tierName === mapped.tierName);
    if (exactTier && typeof exactTier.price === "number") {
      return { tierName: exactTier.tierName, price: exactTier.price };
    }
  }

  return { tierName: mapped.tierName, price: mapped.basePrice };
};

const fetchSeatsAvailablity = async (showId, selectedSeats) => {
  try {
    const showData = await Show.findById(showId);

    if (!showData) return false;

    const normalizedSeats = normalizeSelectedSeats(selectedSeats);

    // Check if any seat is already booked/locked in any tier
    for (const seat of normalizedSeats) {
      for (const tier of showData.seatTiers) {
        if (tier.occupiedSeats[seat.seatNumber]) {
          return false;
        }
      }
    }

    return true;
  } catch (error) {
    console.error("[fetchSeatsAvailablity]", error);
    return false;
  }
};

export const createBooking = async (req, res) => {
  try {
    const { showId, selectedSeats } = req.body;
    const { origin } = req.headers;

    const normalizedSeats = normalizeSelectedSeats(selectedSeats);

    if (!normalizedSeats || normalizedSeats.length === 0) {
      return res.json({
        success: false,
        message: "Please select at least one seat",
      });
    }

    // de-dup seats
    const uniqueSeatNumbers = [...new Set(normalizedSeats.map((s) => s.seatNumber))];
    const uniqueSeats = uniqueSeatNumbers.map((seatNumber) => ({ seatNumber }));

    // Check if seat is available for the selected seats
    const isAvailable = await fetchSeatsAvailablity(showId, uniqueSeats);

    if (!isAvailable) {
      return res.json({
        success: false,
        message: "Selected seats are not available.",
      });
    }

    // Get the show details with theatre and screen
    const showData = await Show.findById(showId)
      .populate("movie")
      .populate("theatre")
      .populate("screen");

    if (!showData) {
      return res.json({ success: false, message: "Show not found" });
    }

    // Reject if movie is disabled
    if (showData.movie && showData.movie.isActive === false) {
      return res.json({ success: false, message: "This movie is not available for booking" });
    }

    // Calculate total amount and create booking seats array (tier from show or screen)
    let totalAmount = 0;
    const bookedSeatsWithTier = [];

    const invalidSeats = [];
    uniqueSeats.forEach((seat) => {
      const tierInfo = getTierInfoForSeat(showData.screen, seat.seatNumber);
      if (!tierInfo) {
        invalidSeats.push(seat.seatNumber);
        return;
      }

      bookedSeatsWithTier.push({
        seatNumber: seat.seatNumber,
        tierName: tierInfo.tierName,
        price: tierInfo.price,
      });
      totalAmount += tierInfo.price;
    });

    if (invalidSeats.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid seat selection: ${invalidSeats.join(", ")}`,
      });
    }

    // Create booking as pending – seats will be marked occupied only after Stripe payment success
    const booking = await Booking.create({
      user: req.user.id,
      show: showId,
      theatre: showData.theatre._id,
      screen: showData.screen._id,
      bookedSeats: bookedSeatsWithTier,
      amount: totalAmount,
      isPaid: false,
    });

    // Lock seats immediately to avoid race conditions.
    // These locks will be replaced with the user id on payment success,
    // or released by the Inngest check-payment job.
    if (showData && showData.seatTiers && Array.isArray(showData.seatTiers)) {
      for (const seat of bookedSeatsWithTier) {
        let tierIndex = showData.seatTiers.findIndex((t) => t.tierName === seat.tierName);

        // Ensure tier exists in showData so the Stripe webhook can mark it paid later.
        if (tierIndex === -1) {
          showData.seatTiers.push({
            tierName: seat.tierName,
            price: seat.price,
            occupiedSeats: {},
          });
          tierIndex = showData.seatTiers.length - 1;
        }

        if (!showData.seatTiers[tierIndex].occupiedSeats) {
          showData.seatTiers[tierIndex].occupiedSeats = {};
        }

        // If someone locked/booked it between availability check and now, abort
        if (showData.seatTiers[tierIndex].occupiedSeats[seat.seatNumber]) {
          await Booking.findByIdAndDelete(booking._id);
          return res.status(409).json({
            success: false,
            message: "Selected seats are not available.",
          });
        }

        showData.seatTiers[tierIndex].occupiedSeats[seat.seatNumber] = `LOCKED:${booking._id.toString()}`;
      }
      showData.markModified("seatTiers");
      await showData.save();
    }

    // Stripe Gateway initialize
    const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);

    const amountInUsd = convertInrToUsd(totalAmount);

    // Creating line items from Stripe
    const lineItems = [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: showData.movie.title,
            description: `${bookedSeatsWithTier.length} seat(s) - Screen ${showData.screen?.screenNumber || ""} at ${showData.theatre?.name || ""}`,
          },
          unit_amount: Math.round(amountInUsd * 100),
        },
        quantity: 1,
      },
    ];

    const session = await stripeInstance.checkout.sessions.create({
      success_url: `${origin}/my-bookings?payment=success`,
      cancel_url: `${origin}/seat-layout/${showId}?payment=cancelled`,
      line_items: lineItems,
      mode: "payment",
      metadata: {
        bookingId: booking._id.toString(),
      },
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // Expires in 30 minutes
    });

    booking.paymentLink = session.url;
    booking.paymentIntentId = session.payment_intent || session.id;
    await booking.save();

    // Run inngest scheduler function to check payment status after 10 minutes
    await inngest.send({
      name: "app/checkpayment",
      data: { bookingId: booking._id.toString() },
    });

    res.json({ success: true, url: session.url });
  } catch (error) {
    console.error("[createBooking]", error);
    
    // Handle specific error cases
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: "Invalid booking data. Please check all fields and try again."
      });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: "Invalid data format. Please check your selection and try again."
      });
    }
    
    if (error.type === 'StripeCardError') {
      return res.status(400).json({
        success: false,
        message: "Payment failed. Please check your card details and try again."
      });
    }
    
    if (error.type === 'StripeRateLimitError') {
      return res.status(429).json({
        success: false,
        message: "Too many requests. Please wait a moment and try again."
      });
    }
    
    if (error.message && error.message.includes('timeout')) {
      return res.status(500).json({
        success: false,
        message: "Booking is taking too long. Please try again."
      });
    }
    
    // Generic error with user-friendly message
    res.status(500).json({ 
      success: false, 
      message: "Unable to process your booking right now. Please try again in a few minutes." 
    });
  }
};

export const fetchOccupiedSeats = async (req, res) => {
  try {
    const { showId } = req.params;
    const showData = await Show.findById(showId);

    if (!showData) {
      return res.json({ success: false, message: "Show not found" });
    }

    // Flatten all occupied seats from all tiers
    const occupiedSeats = [];
    showData.seatTiers.forEach((tier) => {
      const seatsInTier = Object.keys(tier.occupiedSeats);
      occupiedSeats.push(...seatsInTier);
    });

    res.json({
      success: true,
      occupiedSeats,
      seatTiers: showData.seatTiers,
      totalCapacity: showData.totalCapacity,
      occupiedSeatsCount: showData.occupiedSeatsCount,
    });
  } catch (error) {
    console.error("[fetchOccupiedSeats]", error);
    
    // Handle specific error cases
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: "Invalid show ID format."
      });
    }
    
    if (error.message && error.message.includes('timeout')) {
      return res.status(500).json({
        success: false,
        message: "Unable to load seat information right now. Please try again."
      });
    }
    
    // Generic error with user-friendly message
    res.status(500).json({ 
      success: false, 
      message: "Unable to load seat information. Please try again in a few minutes." 
    });
  }
};

export const fetchUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate({ path: "show", populate: { path: "movie" } })
      .populate("theatre")
      .populate("screen")
      .sort({ createdAt: -1 });

    res.json({ success: true, bookings });
  } catch (error) {
    console.error("[fetchUserBookings]", error);
    
    // Handle specific error cases
    if (error.name === 'CastError') {
      return res.status(500).json({
        success: false,
        message: "Unable to load your bookings. Please log out and log back in."
      });
    }
    
    if (error.message && error.message.includes('timeout')) {
      return res.status(500).json({
        success: false,
        message: "Loading your bookings is taking too long. Please try again."
      });
    }
    
    // Generic error with user-friendly message
    res.status(500).json({ 
      success: false, 
      message: "Unable to load your bookings right now. Please try again in a few minutes." 
    });
  }
};

export const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { reason } = req.body;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.json({ success: false, message: "Booking not found" });
    }

    if (booking.user !== req.user.id) {
      return res.json({
        success: false,
        message: "Unauthorized to cancel this booking",
      });
    }

    if (booking.isPaid === false) {
      return res.json({
        success: false,
        message: "Cannot cancel unpaid bookings",
      });
    }

    // Release seats back to available pool (only if they were marked – i.e. was paid)
    const showData = await Show.findById(booking.show);
    if (showData && showData.seatTiers) {
      booking.bookedSeats.forEach((seat) => {
        const tierIndex = showData.seatTiers.findIndex(
          (t) => t.tierName === seat.tierName
        );
        if (tierIndex !== -1 && showData.seatTiers[tierIndex].occupiedSeats) {
          delete showData.seatTiers[tierIndex].occupiedSeats[seat.seatNumber];
        }
      });
      showData.occupiedSeatsCount = Math.max(0, (showData.occupiedSeatsCount || 0) - booking.bookedSeats.length);
      showData.markModified("seatTiers");
      await showData.save();
    }

    booking.cancellationReason = reason || "User requested cancellation";
    booking.isPaid = false;
    await booking.save();

    res.json({ success: true, message: "Booking cancelled successfully" });
  } catch (error) {
    console.error("[cancelBooking]", error);
    
    // Handle specific error cases
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID format."
      });
    }
    
    if (error.message && error.message.includes('timeout')) {
      return res.status(500).json({
        success: false,
        message: "Cancellation is taking too long. Please try again."
      });
    }
    
    // Generic error with user-friendly message
    res.status(500).json({ 
      success: false, 
      message: "Unable to cancel your booking right now. Please try again in a few minutes." 
    });
  }
};

