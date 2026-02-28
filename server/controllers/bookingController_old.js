import { inngest } from "../inngest/index.js";
import Booking from "../models/Booking.js";
import Show from "../models/show_tbls.js";
import User from "../models/User.js";
import Stripe from "stripe";
import { markSeatsAndCompleteBooking } from "./stripeWebhooks.js";

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

  return row[colIndex]?.code || null;
};

const getTierInfoForSeat = (show, seatNumber) => {
  const screen = show.screen;

  // Prefer explicit tier configuration by rows (if present)
  if (screen?.seatTiers && Array.isArray(screen.seatTiers) && screen.seatTiers.length > 0) {
    const row = seatNumber.charAt(0);
    for (const tier of screen.seatTiers) {
      const rows = tier.rows || [];
      if (rows.includes(row)) {
        // If show has override price for this tier, use it
        if (show.seatTiers && Array.isArray(show.seatTiers)) {
          const showTier = show.seatTiers.find((t) => t.tierName === tier.tierName);
          if (showTier && typeof showTier.price === "number") {
            return { tierName: tier.tierName, price: showTier.price };
          }
        }
        // Validate tier.price
        const price = Number(tier.price);
        if (!isNaN(price)) {
          return { tierName: tier.tierName, price };
        }
      }
    }
  }

  // Fallback: derive from seatLayout seat code (S/D/P/R/C)
  const seatCode = getSeatCodeFromLayout(screen?.seatLayout, seatNumber);
  const mapped = SEAT_CODE_MAP[seatCode];
  if (!mapped) return null;

  // If show has tier prices configured with same names, prefer those prices
  if (show.seatTiers && Array.isArray(show.seatTiers) && show.seatTiers.length > 0) {
    const showTier = show.seatTiers.find((t) => t.tierName === mapped.tierName);
    if (showTier && typeof showTier.price === "number") {
      return { tierName: showTier.tierName, price: showTier.price };
    }
  }

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

export const confirmStripePayment = async (req, res) => {
  try {
    console.log("[confirmStripePayment] Starting payment confirmation");
    const { sessionId } = req.body;
    console.log("[confirmStripePayment] Session ID:", sessionId);

    const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripeInstance.checkout.sessions.retrieve(sessionId);
    console.log("[confirmStripePayment] Retrieved session:", session.id);

    // Get booking ID from session metadata
    const bookingId = session.metadata?.bookingId;
    console.log("[confirmStripePayment] Booking ID:", bookingId);
    
    if (!bookingId) {
      console.log("[confirmStripePayment] Missing booking ID in session metadata");
      return res.status(400).json({
        success: false,
        message: "Invalid session - missing booking reference",
      });
    }

    // Complete the booking process
    console.log("[confirmStripePayment] Calling markSeatsAndCompleteBooking");
    await markSeatsAndCompleteBooking(stripeInstance, bookingId, session);
    console.log("[confirmStripePayment] Completed markSeatsAndCompleteBooking");

    res.json({ success: true });
  } catch (error) {
    console.error("[confirmStripePayment] Error occurred:", error);
    
    // Handle specific error cases
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: "Invalid session ID format."
      });
    }
    
    if (error.message && error.message.includes('timeout')) {
      return res.status(500).json({
        success: false,
        message: "Payment confirmation is taking too long. Please check your bookings page."
      });
    }
    
    // Generic error with user-friendly message
    res.status(500).json({ 
      success: false, 
      message: "Unable to confirm your payment right now. Please check your bookings page." 
    });
    
  }
};

export const createBooking = async (req, res) => {
  try {
    const { showId, selectedSeats } = req.body;
    const { user } = req;
    const origin = req.get("origin") || req.get("host");

    console.log("[createBooking] Request received:", {
      showId,
      selectedSeats,
      user: user?._id,
      origin
    });

    if (!showId) {
      console.log("[createBooking] Missing showId");
      return res.status(400).json({ success: false, message: "Show ID is required" });
    }

    let uniqueSeats = normalizeSelectedSeats(selectedSeats);

    if (uniqueSeats.length === 0) {
      return res.json({ success: false, message: "At least one seat must be selected" });
    }

    // Enforce maximum seat limit
    if (uniqueSeats.length > 10) {
      return res.json({
        success: false,
        message: "Maximum 10 seats allowed per booking",
      });
    }

    // Check if selected seats are still available (race condition avoidance)
    const isAvailable = await fetchSeatsAvailablity(showId, uniqueSeats);
    if (!isAvailable) {
      return res.json({
        success: false,
        message: "One or more selected seats are no longer available. Please try again.",
      });
    }

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

    console.log("=== DEBUG: Price Calculation ===");
    console.log("Selected seats:", selectedSeats);

    uniqueSeats.forEach((seat) => {
      const tierInfo = getTierInfoForSeat(showData, seat.seatNumber);
      console.log(`Seat ${seat.seatNumber}: tierInfo =`, tierInfo);
      
      if (!tierInfo) {
        invalidSeats.push(seat.seatNumber);
        return;
      }

      bookedSeatsWithTier.push({
        seatNumber: seat.seatNumber,
        tierName: tierInfo.tierName,
        price: tierInfo.price,
      });

      totalAmount += Number(tierInfo.price);
      console.log(`Added price: ${tierInfo.price}, Running total: ${totalAmount}`);
    });

    console.log(`Final totalAmount: ${totalAmount}`);

    if (isNaN(totalAmount) || totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid total amount calculated. Please contact support.",
      });
    }

    if (invalidSeats.length > 0) {
      return res.json({
        success: false,
        message: `Invalid seat(s): ${invalidSeats.join(", ")}. Please select valid seats.`,
      });
    }

    // Create booking record with tentative status
    const bookingData = {
      user_id: user.id,
      show_id: showId,
      seats_booked: bookedSeatsWithTier.map((s) => s.seatNumber), // Seat IDs for references
      total_amount: totalAmount,
      status: "pending",
      isPaid: false,
      payment_link: null,
    };

    console.log("[createBooking] Booking data to save:", JSON.stringify(bookingData, null, 2));

    const booking = new Booking(bookingData);

    // Validate before saving to catch errors early
    const validationError = booking.validateSync();
    if (validationError) {
      console.error("[createBooking] Validation errors:", JSON.stringify(validationError.errors, null, 2));
      const errorMessages = Object.values(validationError.errors).map(err => err.message).join(", ");
      return res.status(400).json({
        success: false,
        message: `Booking validation failed: ${errorMessages}`
      });
    }

    await booking.save();

    // Lock the selected seats temporarily to prevent double booking
    if (showData.seatTiers && Array.isArray(showData.seatTiers)) {
      for (const seat of bookedSeatsWithTier) {
        const tierIndex = showData.seatTiers.findIndex(
          (t) => t.tierName === seat.tierName
        );

        if (tierIndex !== -1) {
          if (!showData.seatTiers[tierIndex].occupiedSeats) {
            showData.seatTiers[tierIndex].occupiedSeats = {};
          }

          showData.seatTiers[tierIndex].occupiedSeats[seat.seatNumber] = `LOCKED:${booking._id.toString()}`;
        }
      }
      showData.markModified("seatTiers");
      await showData.save();
    }

    // Stripe Gateway initialize
    const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Fetch user data for customer information (required for Indian regulations)
    const userData = await User.findById(user.id);
    if (!userData) {
      return res.status(400).json({
        success: false,
        message: "User not found"
      });
    }

    // STRIPE PAYMENT (INR) - Create line items per seat with correct pricing
    const lineItems = bookedSeatsWithTier.map((seat) => ({
      price_data: {
        currency: "inr",
        product_data: {
          name: `${showData.movie.title} - ${seat.tierName}`,
          description: `Seat ${seat.seatNumber} | Screen ${showData.screen?.screenNumber || ""} | ${showData.theatre?.name || ""}`,
        },
        unit_amount: Math.round(Number(seat.price) * 100), // INR → paise
      },
      quantity: 1,
    }));

    // Calculate total amount in paise for verification
    const totalAmountInPaise = Math.round(totalAmount * 100);
    const lineItemsTotal = lineItems.reduce((sum, item) => sum + item.price_data.unit_amount, 0);
    
    // Log for debugging the discrepancy
    console.log("=== STRIPE PAYMENT DEBUG ===");
    console.log("Total Amount Calculated:", totalAmount);
    console.log("Total Amount in Paise:", totalAmountInPaise);
    console.log("Line Items Total:", lineItemsTotal);
    console.log("Number of Seats:", bookedSeatsWithTier.length);
    console.log("============================");
    
    // Verify that our calculation matches the line items total
    if (totalAmountInPaise !== lineItemsTotal) {
      console.error("PRICE MISMATCH DETECTED!", {
        calculated: totalAmountInPaise,
        lineItems: lineItemsTotal,
        difference: totalAmountInPaise - lineItemsTotal
      });
    }

    const session = await stripeInstance.checkout.sessions.create({
      success_url: `${origin}/my-bookings?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/seat-layout/${showId}?payment=cancelled`,
      line_items: lineItems,
      mode: "payment",
      customer_email: userData.email,
      metadata: {
        bookingId: booking._id.toString(),
        customerName: userData.name,
        customerPhone: userData.phone,
      },
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      // For Indian regulations compliance - collect customer address
      shipping_address_collection: {
        allowed_countries: ['IN']
      }
    });

    booking.payment_link = session.url;
    await booking.save();

    // Run inngest scheduler function to check payment status after 10 minutes
    await inngest.send({
      name: "app/checkpayment",
      data: { bookingId: booking._id.toString() },
    });

    res.json({ success: true, url: session.url });
  } catch (error) {
    console.error("[createBooking] Error details:", error);
    console.error("[createBooking] Error message:", error.message);
    console.error("[createBooking] Error type:", error.type);
    console.error("[createBooking] Error stack:", error.stack);
    
    // Handle specific error cases
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: "Invalid booking data provided."
      });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: "Invalid show ID format."
      });
    }
    
    if (error.message && error.message.includes('timeout')) {
      return res.status(500).json({
        success: false,
        message: "Booking is taking too long. Please try again."
      });
    }
    
    // Return actual error message for debugging
    res.status(500).json({ 
      success: false, 
      message: error.message || "Unable to process your booking right now. Please try again in a few minutes." 
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
      message: "Unable to load seat information right now. Please try again in a few minutes." 
    });
  }
};

export const fetchUserBookings = async (req, res) => {
  try {
    console.log("[fetchUserBookings] Request received");
    console.log("[fetchUserBookings] User from middleware:", req.user);
    
    const userId = req.user.id;
    const statusFilter = req.query.status;

    console.log("[fetchUserBookings] User ID:", userId);
    console.log("[fetchUserBookings] Status filter:", statusFilter);

    let query = { user_id: userId };

    console.log("[fetchUserBookings] Query:", query);

    const bookings = await Booking.find(query)
      .populate({
        path: "show_id",
        populate: [
          { path: "movie" },
          { path: "theatre" },
          { path: "screen" },
        ],
      })
      .populate("seats_booked")
      .sort({ createdAt: -1 });

    console.log("[fetchUserBookings] Found bookings:", bookings.length);
    console.log("[fetchUserBookings] Bookings:", bookings.map(b => ({id: b._id, amount: b.amount, isPaid: b.isPaid, paymentLink: b.paymentLink ? "Yes" : "No"})));

    res.json({ success: true, bookings });
  } catch (error) {
    console.error("[fetchUserBookings]", error);
    res.status(500).json({ 
      success: false, 
      message: "Unable to load your bookings. Please try again." 
    });
  }
};

export const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;

    // Find booking and verify ownership
    const booking = await Booking.findOne({
      _id: bookingId,
      user_id: userId,
    }).populate("show_id");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found or unauthorized access.",
      });
    }

    // Check if booking can be cancelled
    if (booking.status !== "confirmed" && booking.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending or confirmed bookings can be cancelled.",
      });
    }

    // Check cancellation deadline
    const showTime = new Date(booking.show_id.showDateTime);
    const currentTime = new Date();
    const hoursUntilShow = (showTime - currentTime) / (1000 * 60 * 60);

    if (hoursUntilShow < 2) {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel booking within 2 hours of show time.",
      });
    }

    // Update booking status
    booking.status = "cancelled";
    await booking.save();

    res.json({
      success: true,
      message: "Booking cancelled successfully. Refund will be processed shortly.",
    });
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

// Stub functions for missing booking routes
export const getBooking = async (req, res) => {
  res.status(501).json({ success: false, message: "Get single booking not implemented" });
};

export const updateBookingStatus = async (req, res) => {
  res.status(501).json({ success: false, message: "Booking status update not implemented" });
};

export const createStripePayment = async (req, res) => {
  res.status(501).json({ success: false, message: "Stripe payment creation not implemented" });
};

export const confirmPayment = async (req, res) => {
  res.status(501).json({ success: false, message: "Payment confirmation not implemented" });
};

export const getAllBookings = async (req, res) => {
  res.status(501).json({ success: false, message: "Get all bookings not implemented" });
};

// Alias for fetchUserBookings
export const getUserBookings = fetchUserBookings;

// Default export for router compatibility
export default {
  confirmStripePayment,
  createBooking,
  fetchOccupiedSeats,
  fetchUserBookings,
  cancelBooking,
  getBooking,
  updateBookingStatus,
  createStripePayment,
  confirmPayment,
  getAllBookings,
  getUserBookings,
};
