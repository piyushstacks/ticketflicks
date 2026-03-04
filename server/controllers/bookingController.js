/**
 * Booking Controller (active)
 * Uses bookingService for business logic.
 */

import bookingService from "../services/bookingService.js";
import Show from "../models/show_tbls.js";
import Payment from "../models/Payment.js";
import Booking from "../models/Booking.js";
import User from "../models/User.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import Stripe from "stripe";
import { markSeatsAndCompleteBooking } from "./stripeWebhooks.js";
import { inngest } from "../inngest/index.js";

const SEAT_CODE_TO_TIER = { S: "Standard", D: "Deluxe", P: "Premium", R: "Recliner", C: "Couple" };
const SEAT_CODE_PRICES = { S: 150, D: 200, P: 250, R: 350, C: 500 };

const getSeatCodeFromLayout = (seatLayout, seatNumber) => {
  if (!seatLayout?.layout || !Array.isArray(seatLayout.layout)) return null;
  const rowLetter = String(seatNumber || "").charAt(0);
  const colRaw = String(seatNumber || "").slice(1);
  const rowIndex = rowLetter.toUpperCase().charCodeAt(0) - 65;
  const colIndex = Number.parseInt(colRaw, 10) - 1;
  if (!Number.isFinite(rowIndex) || !Number.isFinite(colIndex) || rowIndex < 0 || colIndex < 0) return null;
  const row = seatLayout.layout[rowIndex];
  if (!Array.isArray(row) || colIndex >= row.length) return null;
  return row[colIndex]?.code || row[colIndex] || null;
};

// ── Tier name helper (handles both {name} and {tierName} formats) ───────────
const resolveTierName = (t) => t?.tierName || t?.name || null;

// ── Build a tierName→price map from a tiers array ──────────────────────
const buildTierPriceMap = (tiersArray) => {
  const map = {};
  if (!Array.isArray(tiersArray)) return map;
  for (const t of tiersArray) {
    const name = resolveTierName(t);
    if (name && t.price) map[name] = Number(t.price);
  }
  return map;
};

// ── Get tier name for a specific seat from the seatLayout ───────────────
const getTierNameForSeat = (rawLayout, seatNumber) => {
  if (!rawLayout) return null;

  const rowLetter = String(seatNumber || "").charAt(0).toUpperCase();
  const colRaw = String(seatNumber || "").slice(1);
  const rowIndex = rowLetter.charCodeAt(0) - 65;
  const colIndex = Number.parseInt(colRaw, 10) - 1;

  if (rowIndex < 0 || colIndex < 0) return null;

  // Format A (screens_new): [[{seatNumber, tier, isBooked}]]
  if (Array.isArray(rawLayout) && Array.isArray(rawLayout[0])) {
    const cell = rawLayout[rowIndex]?.[colIndex];
    if (!cell) return null;
    if (typeof cell === "object") return cell.tier || cell.tierName || null;
    if (typeof cell === "string") {
      // Letter code → full tier name
      return SEAT_CODE_TO_TIER[cell] || null;
    }
    return null;
  }

  // Format B (old screen_tbl): { layout: [[String]] }
  if (rawLayout.layout && Array.isArray(rawLayout.layout)) {
    const row = rawLayout.layout[rowIndex];
    if (!Array.isArray(row)) return null;
    const code = row[colIndex];
    return code ? (SEAT_CODE_TO_TIER[code] || null) : null;
  }

  return null;
};

// ── Resolve price for a seat ───────────────────────────────────────
const resolveSeatPrice = (seatNumber, backendTierName, showTierMap, screenTierMap, clientSeat, basePrice) => {
  const clientTierName = clientSeat?.tierName;
  const clientPrice = clientSeat?.price;

  // We have potentially two tier names: one derived from the seat map (e.g. "Premium" from "P"), 
  // and one provided by the frontend payload (e.g. "Platinum"). We should check both.
  const tierNamesToCheck = [backendTierName, clientTierName].filter(Boolean);

  for (const tName of tierNamesToCheck) {
    if (showTierMap[tName]) return { tierName: tName, price: showTierMap[tName] };
    if (screenTierMap[tName]) return { tierName: tName, price: screenTierMap[tName] };
  }

  // Map tier name to a letter code price
  for (const tName of tierNamesToCheck) {
    const codeForTier = { Silver: "S", Gold: "D", Platinum: "P", Standard: "S", Deluxe: "D", Premium: "P", Recliner: "R", Couple: "C" };
    const code = codeForTier[tName];
    if (code && SEAT_CODE_PRICES[code]) return { tierName: tName, price: SEAT_CODE_PRICES[code] };
  }

  // Use client-supplied price (if reasonable)
  if (clientPrice && Number(clientPrice) > 0 && Number(clientPrice) < 10000) {
    return { tierName: clientTierName || backendTierName || "Standard", price: Number(clientPrice) };
  }

  return { tierName: backendTierName || clientTierName || "Standard", price: basePrice || 150 };
};

/**
 * Create a new booking + Stripe checkout session
 * Returns { success: true, url: stripeCheckoutUrl }
 */
export const createBooking = asyncHandler(async (req, res) => {
  const { showId, selectedSeats } = req.body;
  const userId = req.user.id;
  const origin = req.get("origin") || `http://localhost:${process.env.PORT || 3000}`;

  if (!showId || !selectedSeats?.length) {
    return res.status(400).json({ success: false, message: "showId and selectedSeats are required" });
  }

  // Normalize seats
  const uniqueSeats = [...new Map(
    selectedSeats.map(s => {
      const num = typeof s === "string" ? s : s?.seatNumber;
      return [num, { seatNumber: String(num || "").trim().toUpperCase() }];
    })
  ).values()].filter(s => s.seatNumber);

  if (uniqueSeats.length === 0) {
    return res.status(400).json({ success: false, message: "No valid seats selected" });
  }
  if (uniqueSeats.length > 10) {
    return res.status(400).json({ success: false, message: "Maximum 10 seats per booking" });
  }

  // Load show with .lean() so we get plain JS objects — no Mongoose schema transformation
  const showRaw = await Show.findById(showId)
    .populate("movie")
    .populate("theatre")
    .populate({ path: "screen", model: "ScreenTbl" })
    .lean();

  // Keep a non-lean reference for .save() operations later
  const show = await Show.findById(showId);
  // Copy populated fields for later use
  const showData = { ...showRaw };

  if (!showRaw) return res.status(404).json({ success: false, message: "Show not found" });
  if (showRaw.status === "cancelled" || showRaw.isActive === false) {
    return res.status(400).json({ success: false, message: "This show is no longer available" });
  }

  // Check if show has fully ended
  const runtimeMin = showRaw.movie?.runtime || showRaw.movie?.duration_min || 180;
  const endTime = new Date(new Date(showRaw.showDateTime).getTime() + runtimeMin * 60 * 1000);
  if (new Date() > endTime) {
    return res.status(400).json({ success: false, message: "Cannot book for a show that has already ended" });
  }

  if (showRaw.endDate && new Date() > new Date(showRaw.endDate)) {
    return res.status(400).json({ success: false, message: "Booking for this show is disabled as its run has ended." });
  }

  if (showRaw.startDate && new Date() < new Date(showRaw.startDate)) {
    return res.status(400).json({ success: false, message: "Booking for this show hasn't started yet." });
  }

  // Movie availability check
  if (showRaw.movie?.isActive === false) {
    return res.status(400).json({ success: false, message: "This movie is not available for booking" });
  }

  // Build tier→price maps from plain JS data (no Mongoose field stripping)
  const showTierMap = buildTierPriceMap(showRaw.seatTiers);      // e.g. { Silver: 150, Gold: 220, Platinum: 250 }
  const screenTierMap = buildTierPriceMap(showRaw.screen?.seatTiers); // fallback from screen

  console.log("[createBooking] showTierMap:", JSON.stringify(showTierMap));
  console.log("[createBooking] screenTierMap:", JSON.stringify(screenTierMap));

  // Build a seatNumber→ tierName map from the screen layout (screens_new format)
  const rawLayout = showRaw.screen?.seatLayout;

  // Calculate pricing per seat — using robust multi-fallback resolution
  let totalAmount = 0;
  const bookedSeatsWithTier = [];
  for (const seat of uniqueSeats) {
    // Get tier name directly from the layout cell
    const tierName = getTierNameForSeat(rawLayout, seat.seatNumber);
    // Find price using all available sources
    const clientSeatInner = selectedSeats.find(s => (typeof s === "string" ? s : s?.seatNumber) === seat.seatNumber);
    const clientSeatObj = typeof clientSeatInner === "object" ? clientSeatInner : { seatNumber: seat.seatNumber };
    const { tierName: resolvedTierName, price } = resolveSeatPrice(
      seat.seatNumber, tierName, showTierMap, screenTierMap, clientSeatObj, showRaw.basePrice
    );
    console.log(`[createBooking] Seat ${seat.seatNumber}: tier=${resolvedTierName}, price=₹${price}`);
    bookedSeatsWithTier.push({ seatNumber: seat.seatNumber, tierName: resolvedTierName, price });
    totalAmount += price;
  }

  if (!totalAmount || totalAmount <= 0) {
    return res.status(400).json({ success: false, message: "Could not calculate seat pricing" });
  }

  // Load user
  const userData = await User.findById(userId);
  if (!userData) return res.status(400).json({ success: false, message: "User not found" });

  // Create booking (pending)
  const booking = await Booking.create({
    user_id: userId,
    show_id: showId,
    seats_booked: bookedSeatsWithTier,
    total_amount: totalAmount,
    status: "pending",
    payment_status: "pending",
    payment_link: null,
  });

  // Temporarily lock seats to prevent double booking
  if (show.seatTiers && Array.isArray(show.seatTiers) && show.seatTiers.length) {
    for (const seat of bookedSeatsWithTier) {
      // Support both tierName (old) and name (new screens_new) field
      const tierIdx = show.seatTiers.findIndex(
        t => (t.tierName || t.name) === seat.tierName
      );
      if (tierIdx !== -1) {
        if (!show.seatTiers[tierIdx].occupiedSeats) show.seatTiers[tierIdx].occupiedSeats = {};
        show.seatTiers[tierIdx].occupiedSeats[seat.seatNumber] = `LOCKED:${booking._id}`;
      }
    }
    show.markModified("seatTiers");
    await show.save();
  }

  // Create Stripe checkout session
  const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);

  // Format phone for Stripe (requires E.164, assume +91 since data handles 10 digits India mostly)
  const phoneFormatted = userData.phone ? (userData.phone.startsWith("+") ? userData.phone : `+91${userData.phone}`) : undefined;

  // Try to find an existing Stripe customer to reuse or create a new one
  let stripeCustomerId;
  try {
    const existingCustomers = await stripeInstance.customers.list({
      email: userData.email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      stripeCustomerId = existingCustomers.data[0].id;
      // Update phone if missing
      if (!existingCustomers.data[0].phone && phoneFormatted) {
        await stripeInstance.customers.update(stripeCustomerId, { phone: phoneFormatted });
      }
    } else {
      const newCustomer = await stripeInstance.customers.create({
        email: userData.email,
        name: userData.name || "",
        ...(phoneFormatted && { phone: phoneFormatted }),
      });
      stripeCustomerId = newCustomer.id;
    }
  } catch (err) {
    console.warn("[createBooking] Could not link Stripe customer:", err.message);
  }

  const lineItems = bookedSeatsWithTier.map(seat => ({
    price_data: {
      currency: "inr",
      product_data: {
        name: `${showRaw.movie?.title || "Movie"} - ${seat.tierName}`,
        description: `Seat ${seat.seatNumber} | ${showRaw.theatre?.name || ""}`,
      },
      unit_amount: Math.round(Number(seat.price) * 100), // INR paise
    },
    quantity: 1,
  }));

  const sessionConfig = {
    success_url: `${origin}/my-bookings?payment=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/seat-layout/${showId}?payment=cancelled`,
    line_items: lineItems,
    mode: "payment",
    billing_address_collection: "required",
    shipping_address_collection: {
      allowed_countries: ["IN"],
    },
    metadata: {
      bookingId: booking._id.toString(),
      customerName: userData.name || "",
      customerPhone: userData.phone || "",
    },
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
  };

  // If we have a customer, use it to permanently lock email and prefill uneditable phone
  if (stripeCustomerId) {
    sessionConfig.customer = stripeCustomerId;
    sessionConfig.customer_update = {
      address: "auto",
      name: "auto",
    };
  } else {
    // Fallback if customer logic fails
    sessionConfig.customer_email = userData.email;
    sessionConfig.phone_number_collection = { enabled: true };
    if (userData.name) {
      sessionConfig.customer_creation = "if_required";
    }
  }

  const session = await stripeInstance.checkout.sessions.create(sessionConfig);

  booking.payment_link = session.url;
  await booking.save();

  // Schedule payment status check via inngest
  try {
    await inngest.send({ name: "app/checkpayment", data: { bookingId: booking._id.toString() } });
  } catch (e) {
    console.warn("[createBooking] inngest send failed (non-fatal):", e.message);
  }

  res.json({ success: true, url: session.url });
});

/**
 * Confirm booking after Stripe payment
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
 * Get booking details by ID
 */
export const getBookingDetails = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const booking = await bookingService.getBookingDetails(bookingId);
  res.json({ success: true, booking });
});

/**
 * Get payment info for a booking
 */
export const getPaymentByBooking = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const payment = await Payment.findOne({ booking_id: bookingId });
  if (!payment) {
    return res.status(404).json({ success: false, message: "Payment not found for this booking" });
  }
  res.json({ success: true, payment });
});

/**
 * Cancel a booking
 */
export const cancelBooking = asyncHandler(async (req, res) => {
  // Accept both :bookingId and :id as param names
  const bookingId = req.params.bookingId || req.params.id;
  const { reason } = req.body;

  const result = await bookingService.cancelBooking(bookingId, reason);
  res.json({ success: true, message: "Booking cancelled successfully", ...result });
});

/**
 * Check seats availability — supports both:
 *   GET /seats/:showId  (SeatLayout.jsx — returns occupied seats for the show)
 *   POST /bookings/availability/:showId (body has selectedSeats for specific check)
 */
export const checkSeatsAvailability = asyncHandler(async (req, res) => {
  // GET style: return all occupied seats for the show
  const showId = req.params.showId || req.body?.showId;
  const show = await Show.findById(showId);
  if (!show) {
    return res.status(404).json({ success: false, message: "Show not found" });
  }

  // Aggregate all occupied seats across all tiers
  const occupiedSeats = [];
  if (show.seatTiers && Array.isArray(show.seatTiers)) {
    show.seatTiers.forEach((tier) => {
      if (tier.occupiedSeats && typeof tier.occupiedSeats === "object") {
        Object.entries(tier.occupiedSeats).forEach(([seatNum, val]) => {
          if (val) occupiedSeats.push(seatNum);
        });
      }
    });
  }
  // Also check seats_booked on confirmed bookings
  const bookings = await Booking.find({ show_id: showId, status: { $in: ["confirmed", "pending"] } });
  bookings.forEach((b) => {
    (b.seats_booked || []).forEach((s) => {
      const seat = typeof s === "string" ? s : s.seatNumber;
      if (seat && !occupiedSeats.includes(seat)) occupiedSeats.push(seat);
    });
  });

  // If specific seats were passed in body (POST style), do availability check too
  const { selectedSeats } = req.body || {};
  if (selectedSeats && Array.isArray(selectedSeats)) {
    const availability = await bookingService.checkSeatsAvailability(showId, selectedSeats);
    return res.json({
      success: availability.available,
      available: availability.available,
      unavailableSeats: availability.unavailableSeats,
      occupiedSeats,
      seatTiers: show.seatTiers,
    });
  }

  res.json({ success: true, occupiedSeats, seatTiers: show.seatTiers });
});

/**
 * Calculate seat pricing
 */
export const calculatePricing = asyncHandler(async (req, res) => {
  const { showId, selectedSeats } = req.body;
  const show = await Show.findById(showId);
  if (!show) {
    return res.status(404).json({ success: false, message: "Show not found" });
  }
  const pricing = bookingService.calculateSeatPricing(show, selectedSeats);
  res.json({ success: true, pricing });
});

/**
 * Get logged-in user's own bookings
 * - Auto-expires pending bookings past the 10-min Stripe window
 * - Returns paymentLink for bookings still within the window (fixes Pay Now button)
 * - Includes receiptUrl from Payment collection
 */
export const getMyBookings = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const TEN_MINUTES = 10 * 60 * 1000;

  const bookings = await Booking.find({ user_id: userId })
    .populate({
      path: "show_id",
      populate: [
        { path: "movie", select: "title poster_path overview genres vote_average runtime" },
        { path: "theatre", select: "name city location" },
        { path: "screen", model: "ScreenTbl", select: "name screenNumber" },
      ],
    })
    .sort({ createdAt: -1 })
    .limit(50);

  // Auto-expire overdue pending bookings server-side
  const expiredIds = bookings
    .filter(
      (b) =>
        b.payment_status !== "completed" &&
        b.status !== "cancelled" &&
        Date.now() - new Date(b.createdAt).getTime() >= TEN_MINUTES
    )
    .map((b) => b._id);

  if (expiredIds.length > 0) {
    await Booking.updateMany(
      { _id: { $in: expiredIds } },
      {
        $set: {
          payment_link: null,
          status: "cancelled",
          cancellation_reason: "Payment window expired (10 minutes)",
          cancelled_at: new Date(),
        },
      }
    );
    // Reflect changes in local objects for accurate response
    bookings.forEach((b) => {
      if (expiredIds.map(String).includes(b._id.toString())) {
        b.payment_link = null;
        b.status = "cancelled";
      }
    });
  }

  // Batch-fetch payment records for receiptUrl
  const bookingIds = bookings.map((b) => b._id);
  const paymentRecords = await Payment.find({ booking_id: { $in: bookingIds } });
  const paymentMap = {};
  paymentRecords.forEach((p) => {
    paymentMap[p.booking_id.toString()] = p;
  });

  const formatted = bookings.map((b) => {
    const isPaid = b.payment_status === "completed";
    const isWithinPayWindow = Date.now() - new Date(b.createdAt).getTime() < TEN_MINUTES;
    const paymentLink =
      !isPaid && isWithinPayWindow && b.status !== "cancelled" && b.payment_link
        ? b.payment_link
        : null;
    const paymentRecord = paymentMap[b._id.toString()] || null;

    return {
      _id: b._id,
      bookingId: b._id,
      show: b.show_id,
      theatre: b.show_id?.theatre || null,
      screen: b.show_id?.screen || null,
      bookedSeats: b.seats_booked || [],
      amount: b.total_amount || 0,
      status: b.status,
      paymentStatus: b.payment_status,
      isPaid,
      paymentLink,
      receiptUrl: paymentRecord?.receipt_url || null,
      transactionId: paymentRecord?.transaction_id || b.payment_id || null,
      paymentTime: paymentRecord?.payment_time || null,
      createdAt: b.createdAt,
    };
  });

  res.json({ success: true, bookings: formatted });
});

export default {
  createBooking,
  confirmStripePayment,
  getBookingDetails,
  getPaymentByBooking,
  cancelBooking,
  checkSeatsAvailability,
  calculatePricing,
  getMyBookings,
};
