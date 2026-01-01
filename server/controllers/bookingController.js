import { inngest } from "../inngest/index.js";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import { getAuth } from "@clerk/express";
import Stripe from "stripe";

//Function to check availability of selected seats for the movie
const fetchSeatsAvailablity = async (showId, selectedSeats) => {
  try {
    const showData = await Show.findById(showId);

    if (!showData) return false;

    const occupiedSeats = showData.occupiedSeats;

    const isAnySeatTaken = selectedSeats.some((seat) => occupiedSeats[seat]);

    return !isAnySeatTaken;
  } catch (error) {
    console.error("[fetchSeatsAvailablity]", error);
    return false;
  }
};

export const createBooking = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { showId, selectedSeats } = req.body;
    const { origin } = req.headers;

    //Check if seat is available for the selected seats
    const isAvailable = await fetchSeatsAvailablity(showId, selectedSeats);

    if (!isAvailable) {
      return res.json({
        success: false,
        message: "Selected seats are not available.",
      });
    }

    //Get the show details
    const showData = await Show.findById(showId).populate("movie");

    //Create a new booking
    const booking = await Booking.create({
      user: userId,
      show: showId,
      amount: showData.showPrice * selectedSeats.length,
      bookedSeats: selectedSeats,
    });

    selectedSeats.map((seat) => {
      showData.occupiedSeats[seat] = userId;
    });

    showData.markModified("occupiedSeats");

    await showData.save();

    // Stripe Gateway initialize
    const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);

    // //Creating line items from stripe
    const lineItems = [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: showData.movie.title,
          },
          unit_amount: Math.floor(booking.amount * 100),
        },
        quantity: 1,
      },
    ];

    const session = await stripeInstance.checkout.sessions.create({
      success_url: `${origin}/loading/my-bookings?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/my-bookings`,
      line_items: lineItems,
      mode: "payment",
      metadata: {
        bookingId: booking._id.toString(),
      },
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // Expires in 30 minutes
    });

    booking.paymentLink = session.url;
    booking.paymentSessionId = session.id;
    await booking.save();

    //Run inngest scheduler function to check payment status after 10 minutes
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

export const verifyBookingPayment = async (req, res) => {
  try {
    const sessionId = req.query.session_id;

    if (!sessionId) {
      return res.json({ success: false, message: "session_id is required" });
    }

    const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripeInstance.checkout.sessions.retrieve(sessionId);

    const bookingId = session?.metadata?.bookingId;
    if (!bookingId) {
      return res.json({ success: false, message: "Booking not found" });
    }

    if (session.payment_status !== "paid") {
      return res.json({ success: false, message: "Payment not completed" });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.json({ success: false, message: "Booking not found" });
    }

    if (!booking.isPaid) {
      booking.isPaid = true;
      booking.paymentLink = "";
      booking.paymentSessionId = booking.paymentSessionId || sessionId;
      await booking.save();

      const show = await Show.findById(booking.show);
      if (show) {
        booking.bookedSeats.forEach((seat) => {
          show.occupiedSeats[seat] = booking.user;
        });
        show.markModified("occupiedSeats");
        await show.save();
      }

      await inngest.send({
        name: "app/show.booked",
        data: { bookingId: booking._id.toString() },
      });
    } else if (booking.paymentLink) {
      booking.paymentLink = "";
      await booking.save();
    }

    res.json({ success: true, bookingId: booking._id.toString() });
  } catch (error) {
    console.error("[verifyBookingPayment]", error);
    res.json({ success: false, message: error.message });
  }
};

export const fetchOccupiedSeats = async (req, res) => {
  try {
    const { showId } = req.params;
    const showData = await Show.findById(showId);

    const occupiedSeats = Object.keys(showData.occupiedSeats);

    res.json({ success: true, occupiedSeats });
  } catch (error) {
    console.error("[fetchOccupiedSeats]", error);
    res.json({ success: false, message: error.message });
  }
};
