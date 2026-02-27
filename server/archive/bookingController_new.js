import { inngest } from "../inngest/index.js";
import Booking from "../models/Booking_new.js";
import Show from "../models/Show_new.js";
import User from "../models/User_new.js";
import Seat from "../models/Seat.js";
import SeatCategory from "../models/SeatCategory.js";
import Payment from "../models/Payment.js";
import Stripe from "stripe";

const INR_TO_USD_RATE = Number(process.env.INR_TO_USD_RATE || 0.011);

const convertInrToUsd = (amountInInr) => amountInInr * INR_TO_USD_RATE;

// Create new booking
export const createBooking = async (req, res) => {
  try {
    const { show_id, seat_ids, user_id } = req.body;

    if (!show_id || !seat_ids || !Array.isArray(seat_ids) || seat_ids.length === 0) {
      return res.json({
        success: false,
        message: "Please provide show_id and at least one seat_id",
      });
    }

    const show = await Show.findById(show_id)
      .populate("movie_id")
      .populate("theater_id")
      .populate("screen_id");

    if (!show || !show.isActive) {
      return res.json({ success: false, message: "Show not found or inactive" });
    }

    // Check if seats are available
    const bookedSeats = await Booking.find({
      show_id,
      status: { $in: ["confirmed", "pending"] },
      seats_booked: { $in: seat_ids },
    });

    if (bookedSeats.length > 0) {
      return res.json({
        success: false,
        message: "One or more selected seats are already booked",
      });
    }

    // Calculate total amount from seat categories
    const seats = await Seat.find({ _id: { $in: seat_ids } }).populate("category_id");
    let total_amount = 0;
    seats.forEach((seat) => {
      if (seat.category_id) {
        total_amount += seat.category_id.price;
      }
    });

    const booking = await Booking.create({
      user_id,
      show_id,
      seats_booked: seat_ids,
      total_amount,
      status: "pending",
      isPaid: false,
    });

    await booking.populate("show_id seats_booked");

    res.json({
      success: true,
      message: "Booking created successfully",
      booking,
    });
  } catch (error) {
    console.error("[createBooking]", error);
    res.json({ success: false, message: error.message });
  }
};

// Get user's bookings
export const getUserBookings = async (req, res) => {
  try {
    const { user_id } = req.params;

    const bookings = await Booking.find({ user_id })
      .populate({
        path: "show_id",
        populate: [
          { path: "movie_id", select: "title poster_path" },
          { path: "theater_id", select: "name location" },
          { path: "screen_id", select: "name" },
        ],
      })
      .populate("seats_booked")
      .sort({ createdAt: -1 });

    res.json({ success: true, bookings });
  } catch (error) {
    console.error("[getUserBookings]", error);
    res.json({ success: false, message: error.message });
  }
};

// Get single booking
export const getBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId)
      .populate({
        path: "show_id",
        populate: [
          { path: "movie_id" },
          { path: "theater_id" },
          { path: "screen_id" },
        ],
      })
      .populate("seats_booked");

    if (!booking) {
      return res.json({ success: false, message: "Booking not found" });
    }

    res.json({ success: true, booking });
  } catch (error) {
    console.error("[getBooking]", error);
    res.json({ success: false, message: error.message });
  }
};

// Update booking status
export const updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.json({ success: false, message: "Booking not found" });
    }

    booking.status = status;
    await booking.save();

    res.json({ success: true, message: "Booking status updated", booking });
  } catch (error) {
    console.error("[updateBookingStatus]", error);
    res.json({ success: false, message: error.message });
  }
};

// Cancel booking
export const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.json({ success: false, message: "Booking not found" });
    }

    if (booking.status === "cancelled") {
      return res.json({ success: false, message: "Booking already cancelled" });
    }

    booking.status = "cancelled";
    await booking.save();

    res.json({ success: true, message: "Booking cancelled successfully" });
  } catch (error) {
    console.error("[cancelBooking]", error);
    res.json({ success: false, message: error.message });
  }
};

// Create Stripe payment intent
export const createStripePayment = async (req, res) => {
  try {
    const { booking_id } = req.body;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const booking = await Booking.findById(booking_id).populate("show_id");
    if (!booking) {
      return res.json({ success: false, message: "Booking not found" });
    }

    const amountInUsd = convertInrToUsd(booking.total_amount);
    const amountInCents = Math.round(amountInUsd * 100);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Movie Tickets - ${booking.show_id.movie_id}`,
              description: `Booking #${booking._id}`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/payment-success?booking_id=${booking._id}`,
      cancel_url: `${process.env.CLIENT_URL}/payment-cancel?booking_id=${booking._id}`,
      metadata: { booking_id: booking._id.toString() },
    });

    booking.payment_link = session.url;
    await booking.save();

    res.json({ success: true, paymentUrl: session.url, sessionId: session.id });
  } catch (error) {
    console.error("[createStripePayment]", error);
    res.json({ success: false, message: error.message });
  }
};

// Confirm payment and update booking
export const confirmPayment = async (req, res) => {
  try {
    const { booking_id, transaction_id, payment_method } = req.body;

    const booking = await Booking.findById(booking_id);
    if (!booking) {
      return res.json({ success: false, message: "Booking not found" });
    }

    // Create payment record
    await Payment.create({
      booking_id,
      amount: booking.total_amount,
      method: payment_method || "card",
      status: "success",
      transaction_id,
      payment_time: new Date(),
    });

    // Update booking
    booking.isPaid = true;
    booking.status = "confirmed";
    await booking.save();

    // Remove booked seats from show's available seats
    await Show.findByIdAndUpdate(booking.show_id, {
      $pull: { available_seats: { $in: booking.seats_booked } },
    });

    res.json({ success: true, message: "Payment confirmed", booking });
  } catch (error) {
    console.error("[confirmPayment]", error);
    res.json({ success: false, message: error.message });
  }
};

// Get all bookings (admin)
export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate({
        path: "show_id",
        populate: [
          { path: "movie_id", select: "title" },
          { path: "theater_id", select: "name" },
        ],
      })
      .populate("user_id", "name email")
      .sort({ createdAt: -1 });

    res.json({ success: true, bookings });
  } catch (error) {
    console.error("[getAllBookings]", error);
    res.json({ success: false, message: error.message });
  }
};

export default {
  createBooking,
  getUserBookings,
  getBooking,
  updateBookingStatus,
  cancelBooking,
  createStripePayment,
  confirmPayment,
  getAllBookings,
};
