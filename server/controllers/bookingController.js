import { inngest } from "../inngest/index.js";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import Stripe from "stripe";

const INR_TO_USD_RATE = Number(process.env.INR_TO_USD_RATE || 0.011);

const convertInrToUsd = (amountInInr) => {
  return amountInInr * INR_TO_USD_RATE;
};

// Function to check availability of selected seats with seat tier support
const fetchSeatsAvailablity = async (showId, selectedSeats) => {
  try {
    const showData = await Show.findById(showId);

    if (!showData) return false;

    // Check if any seat is already booked in any tier
    for (const seat of selectedSeats) {
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

// Helper function to find seat tier info
const findSeatTierInfo = (screen, seatNumber) => {
  const row = seatNumber.charAt(0);
  for (const tier of screen.seatTiers) {
    if (tier.rows.includes(row)) {
      return {
        tierName: tier.tierName,
        price: tier.price,
      };
    }
  }
  return null;
};

export const createBooking = async (req, res) => {
  try {
    const { showId, selectedSeats } = req.body;
    const { origin } = req.headers;

    if (!selectedSeats || selectedSeats.length === 0) {
      return res.json({
        success: false,
        message: "Please select at least one seat",
      });
    }

    // Check if seat is available for the selected seats
    const isAvailable = await fetchSeatsAvailablity(showId, selectedSeats);

    if (!isAvailable) {
      return res.json({
        success: false,
        message: "Selected seats are not available.",
      });
    }

    // Get the show details with theater and screen
    const showData = await Show.findById(showId)
      .populate("movie")
      .populate("theater")
      .populate("screen");

    if (!showData) {
      return res.json({ success: false, message: "Show not found" });
    }

    // Calculate total amount and create booking seats array
    let totalAmount = 0;
    const bookedSeatsWithTier = [];

    selectedSeats.forEach((seat) => {
      const tierInfo = findSeatTierInfo(showData.screen, seat.seatNumber);
      if (tierInfo) {
        bookedSeatsWithTier.push({
          seatNumber: seat.seatNumber,
          tierName: tierInfo.tierName,
          price: tierInfo.price,
        });
        totalAmount += tierInfo.price;
      }
    });

    // Create a new booking
    const booking = await Booking.create({
      user: req.user.id,
      show: showId,
      theater: showData.theater._id,
      screen: showData.screen._id,
      bookedSeats: bookedSeatsWithTier,
      amount: totalAmount,
    });

    // Mark seats as occupied in respective tiers
    selectedSeats.forEach((seat) => {
      const tierIndex = showData.seatTiers.findIndex(
        (t) => t.tierName === seat.tierName
      );
      if (tierIndex !== -1) {
        showData.seatTiers[tierIndex].occupiedSeats[seat.seatNumber] =
          req.user.id;
      }
    });

    showData.occupiedSeatsCount = selectedSeats.length;
    showData.markModified("seatTiers");
    await showData.save();

    // Stripe Gateway initialize
    const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);

    const amountInUsd = convertInrToUsd(totalAmount);

    // Creating line items from stripe
    const lineItems = [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: showData.movie.title,
            description: `${selectedSeats.length} seat(s) - ${showData.screen.screenNumber} at ${showData.theater.name}`,
          },
          unit_amount: Math.round(amountInUsd * 100),
        },
        quantity: 1,
      },
    ];

    const session = await stripeInstance.checkout.sessions.create({
      success_url: `${origin}/loading/my-bookings`,
      cancel_url: `${origin}/my-bookings`,
      line_items: lineItems,
      mode: "payment",
      metadata: {
        bookingId: booking._id.toString(),
      },
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // Expires in 30 minutes
    });

    booking.paymentLink = session.url;
    booking.paymentIntentId = session.payment_intent;
    await booking.save();

    // Run inngest scheduler function to check payment status after 10 minutes
    await inngest.send({
      name: "app/checkpayment",
      data: { bookingId: booking._id.toString() },
    });

    res.json({ success: true, url: session.url });
  } catch (error) {
    console.error("[createBooking]", error);
    res.json({ success: false, message: error.message });
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
    res.json({ success: false, message: error.message });
  }
};

export const fetchUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate("show")
      .populate("theater")
      .populate("screen")
      .sort({ createdAt: -1 });

    res.json({ success: true, bookings });
  } catch (error) {
    console.error("[fetchUserBookings]", error);
    res.json({ success: false, message: error.message });
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

    // Release seats back to available pool
    const showData = await Show.findById(booking.show);
    booking.bookedSeats.forEach((seat) => {
      const tierIndex = showData.seatTiers.findIndex(
        (t) => t.tierName === seat.tierName
      );
      if (tierIndex !== -1) {
        delete showData.seatTiers[tierIndex].occupiedSeats[seat.seatNumber];
      }
    });

    showData.occupiedSeatsCount -= booking.bookedSeats.length;
    showData.markModified("seatTiers");
    await showData.save();

    // Update booking status
    booking.cancellationReason = reason || "User requested cancellation";
    booking.isPaid = false;
    await booking.save();

    res.json({ success: true, message: "Booking cancelled successfully" });
  } catch (error) {
    console.error("[cancelBooking]", error);
    res.json({ success: false, message: error.message });
  }
};

